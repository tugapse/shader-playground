import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { AudioCache } from '@engine/audio/audio-cache';
import { AudioEngine } from '@engine/audio/audio-engine';
import { SequencerClock } from '@engine/audio/sequencer-clock';
import { VoiceFactory } from '@engine/audio/voice-factory';
import { AudioService } from './audio.service';
import { SynthNote, SynthPreset } from '@editor/models/synth.types';

@Injectable()
export class SoundMixerPlaybackService {
  private audioService = inject(AudioService);

  // Expose key playback states as signals for UI consumption
  readonly sequence = signal<SynthNote[]>([]);
  readonly isPlaying = signal(false);
  readonly isPaused = signal(false);
  readonly isExporting = signal(false);
  readonly playbackTime = signal(0);

  private playStartTime = 0;
  private activeNodes: any[] = [];
  private playheadAnimationId: number | null = null;
  private lastFreqByTrack: Record<number, number> = {};

  private engine!: AudioEngine;
  private cache!: AudioCache;
  private clock!: SequencerClock;
  private factory!: VoiceFactory;

  // Track max duration dynamically based on sequence
  readonly totalDuration = computed(() => {
    return this.sequence().reduce((max, note) => Math.max(max, note.startTime + note.duration), 0);
  });

  private initAudio() {
    this.audioService.init();
    this.engine = this.audioService.engine;
    this.cache = this.audioService.cache;
    this.clock = this.audioService.clock;
    this.factory = this.audioService.factory;
  }

  previewPreset(preset: SynthPreset) {
    this.initAudio();
    this.lastFreqByTrack = {};
    
    const now = this.engine.getContext().currentTime;
    let node: any;

    if (preset.waveform === 'noise') {
      node = this.factory.triggerNoiseVoice({ ...preset, duration: preset.duration }, now + 0.005);
    } else {
      node = this.factory.triggerSynthVoice(preset.waveform as OscillatorType, { ...preset, duration: preset.duration }, now + 0.05);
    }
    
    this.activeNodes.push(node);
    node.onended = () => {
      try { node.disconnect(); } catch (e) {}
      this.activeNodes = this.activeNodes.filter(n => n !== node);
    };
  }

  playSequence(onFrameUpdate: (time: number) => void) {
    if (this.sequence().length === 0) return;
    this.initAudio();

    if (this.isPlaying() && !this.isPaused()) return;
    
    this.isPlaying.set(true);
    this.isPaused.set(false);
    this.lastFreqByTrack = {};
    
    const ctx = this.engine.getContext();
    const globalStartTime = ctx.currentTime + 0.05;
    this.playStartTime = globalStartTime;

    const stepResolution = 4;
    const bpm = 120;
    this.clock.setBpm(bpm);

    const stepDuration = (60.0 / bpm) / stepResolution;
    const startingStep = Math.round(this.playbackTime() / stepDuration);

    const notesByStep = new Map<number, SynthNote[]>();
    this.sequence().forEach(note => {
      const noteStep = Math.round(note.startTime / stepDuration);
      if (!notesByStep.has(noteStep)) notesByStep.set(noteStep, []);
      notesByStep.get(noteStep)!.push(note);
    });

    this.clock.start((tick, schedulerTime) => {
      const activeTick = startingStep + tick;
      const stepNotes = notesByStep.get(activeTick) || [];

      stepNotes.forEach(note => {
        const prevFreq = this.lastFreqByTrack[note.trackIndex];
        let node: any;

        if (note.waveform === 'noise') {
          node = this.factory.triggerNoiseVoice(note, schedulerTime);
        } else {
          node = this.factory.triggerSynthVoice(note.waveform as OscillatorType, note, schedulerTime, prevFreq);
        }

        this.lastFreqByTrack[note.trackIndex] = note.frequency;
        this.activeNodes.push(node);

        node.onended = () => {
          try { node.disconnect(); } catch (e) {}
          this.activeNodes = this.activeNodes.filter(n => n !== node);
        };
      });
    });

    this.animatePlayhead(globalStartTime, onFrameUpdate);
  }

  pauseSequence() {
    if (!this.isPlaying() || this.isPaused()) return;

    this.isPaused.set(true);
    const elapsed = this.engine.getContext().currentTime - this.playStartTime;
    this.playbackTime.update(t => t + Math.max(0, elapsed));

    this.cleanupActivePlayback();
  }

  stopSequence() {
    this.isPlaying.set(false);
    this.isPaused.set(false);
    this.playbackTime.set(0);

    this.cleanupActivePlayback();
  }

  seekTo(time: number, onFrameUpdate: (time: number) => void) {
    const wasPlaying = this.isPlaying() && !this.isPaused();
    this.cleanupActivePlayback();
    this.playbackTime.set(time);

    if (wasPlaying) {
      this.isPlaying.set(false);
      this.isPaused.set(false);
      this.playSequence(onFrameUpdate);
    }
  }

  private cleanupActivePlayback() {
    if (this.clock) this.clock.stop();
    this.activeNodes.forEach(node => { try { node.stop(); } catch (e) {} });
    this.activeNodes = [];
    if (this.playheadAnimationId) cancelAnimationFrame(this.playheadAnimationId);
  }

  private animatePlayhead(startTime: number, onFrameUpdate: (time: number) => void) {
    const baseOffset = this.playbackTime();

    const update = () => {
      if (!this.isPlaying() || this.isPaused()) return;
      
      const elapsed = this.engine.getContext().currentTime - startTime;
      const currentPos = baseOffset + elapsed;
      
      if (currentPos >= this.totalDuration() + 0.2) {
        this.stopSequence();
        return;
      }

      this.playbackTime.set(Math.max(0, currentPos));
      onFrameUpdate(this.playbackTime());

      this.playheadAnimationId = requestAnimationFrame(update);
    };

    if (this.playheadAnimationId) cancelAnimationFrame(this.playheadAnimationId);
    this.playheadAnimationId = requestAnimationFrame(update);
  }

  async exportWav() {
    const seq = this.sequence();
    if (seq.length === 0) return;
    
    this.isExporting.set(true);
    this.lastFreqByTrack = {};
    
    try {
      const maxTime = this.totalDuration() + 3;
      const sampleRate = 44100;
      
      const offlineCtx = new OfflineAudioContext(2, sampleRate * maxTime, sampleRate);
      const offlineMaster = offlineCtx.createGain();
      offlineMaster.gain.value = 0.8;
      
      const offlineCompressor = offlineCtx.createDynamicsCompressor();
      offlineCompressor.threshold.value = -12;
      offlineCompressor.knee.value = 30;
      offlineCompressor.ratio.value = 12;
      offlineCompressor.attack.value = 0.003;
      offlineCompressor.release.value = 0.25;

      offlineMaster.connect(offlineCompressor);
      offlineCompressor.connect(offlineCtx.destination);

      const offlineReverb = offlineCtx.createConvolver();
      offlineReverb.buffer = this.getReverbIR(offlineCtx);
      offlineReverb.connect(offlineMaster);

      const offlineDelay = offlineCtx.createDelay();
      offlineDelay.delayTime.value = 0.25;
      const offlineDelayFb = offlineCtx.createGain();
      offlineDelayFb.gain.value = 0.4;
      offlineDelay.connect(offlineDelayFb);
      offlineDelayFb.connect(offlineDelay);
      offlineDelay.connect(offlineMaster);

      const offlineCache = new AudioCache(offlineCtx as any);
      const offlineFactory = new VoiceFactory(
        offlineCtx as any,
        offlineCache,
        offlineMaster,
        offlineReverb,
        offlineDelay
      );

const sortedSeq = this.sequence().map(note => ({ ...note })).sort((a, b) => a.startTime - b.startTime);

sortedSeq.forEach(note => {
  const prevFreq = this.lastFreqByTrack[note.trackIndex];
  if (note.waveform === 'noise') {
    offlineFactory.triggerNoiseVoice(note, note.startTime);
  } else {
    offlineFactory.triggerSynthVoice(note.waveform as OscillatorType, note, note.startTime, prevFreq);
  }
  this.lastFreqByTrack[note.trackIndex] = note.frequency;
});

      const renderedBuffer = await offlineCtx.startRendering();
      const wavBlob = this.audioBufferToWav(renderedBuffer);
      
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `WebDAW_Export_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
      
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      this.isExporting.set(false);
    }
  }

  private getReverbIR(ctx: BaseAudioContext): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 2.0; 
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    for (let i = 0; i < length; i++) {
      const decayEnvelope = Math.pow(1 - i / length, 3); 
      left[i] = (Math.random() * 2 - 1) * decayEnvelope;
      right[i] = (Math.random() * 2 - 1) * decayEnvelope;
    }
    return impulse;
  }

  private audioBufferToWav(abuffer: AudioBuffer) {
    let numOfChan = abuffer.numberOfChannels,
        length = abuffer.length * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [], i, sample, offset = 0, pos = 0;

    const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; }
    const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; }

    setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157); 
    setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
    setUint32(abuffer.sampleRate); setUint32(abuffer.sampleRate * 2 * numOfChan); 
    setUint16(numOfChan * 2); setUint16(16); setUint32(0x61746164); setUint32(length - pos - 4); 

    for (i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset])); 
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; 
            view.setInt16(pos, sample, true); 
            pos += 2;
        }
        offset++;
    }
    return new Blob([buffer], { type: "audio/wav" });
  }

loadDemoSong(type: string, presets: SynthPreset[]) {
    this.stopSequence();
    const kick = presets.find(p => p.name === 'Deep Kick')!;
    const snare = presets.find(p => p.name.includes('Snare'))!;
    const bass = presets.find(p => p.name.includes('Bass'))!;
    const pluck = presets.find(p => p.name === 'Pluck Synth')!;
    const laser = presets.find(p => p.name === 'Laser FX')!;
    const pad = presets.find(p => p.name === 'Pad Chord')!;

    const demoSequence: SynthNote[] = [];
    let idCounter = 0;

    if (type === 'techno') {
      // Track 5 (55Hz): Driving Sub-Bass on off-beats
      for (let i = 0; i < 16; i++) {
        demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: (i * 0.5) + 0.25, duration: 0.2, trackIndex: 4 });
      }
      // Track 4 (110Hz): Mid-Bass rhythm matching the kick groove
      for (let i = 0; i < 16; i += 2) {
        demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: i * 0.5, duration: 0.15, trackIndex: 3 });
      }
      // Track 3 (220Hz): Rhythmic Hypnotic Pluck on up-beats
      for (let i = 0; i < 16; i++) {
        if (i % 4 !== 0) {
          demoSequence.push({ ...pluck, id: `demo-${idCounter++}`, startTime: (i * 0.5) + 0.125, duration: 0.1, trackIndex: 2 });
        }
      }
      // Track 2 (440Hz): Clean, snappy syncopated accents
      [1.75, 3.75, 5.75, 7.75].forEach(t => {
        demoSequence.push({ ...pluck, id: `demo-${idCounter++}`, startTime: t, duration: 0.15, trackIndex: 1, delayMix: 0.5 });
      });
      // Track 1 (Noise/880Hz Bypass): White Noise Snare on beats 2 and 4
      for (let i = 0; i < 8; i++) {
        demoSequence.push({ ...snare, id: `demo-${idCounter++}`, startTime: (i * 1.0) + 0.5, trackIndex: 0 });
      }
    } 
    else if (type === 'synthwave') {
      // Track 5 (55Hz): Fast, driving 16th-note running bassline
      for (let i = 0; i < 32; i++) {
        demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: i * 0.25, duration: 0.12, trackIndex: 4, distortionMix: 0.2 });
      }
      // Track 4 (110Hz): Octave mid-bass bounce
      [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5].forEach(t => {
        demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: t + 0.125, duration: 0.1, trackIndex: 3 });
      });
      // Track 3 (220Hz): Sustained retro background pads
      for (let bar = 0; bar < 4; bar++) {
        demoSequence.push({ ...pad, id: `demo-${idCounter++}`, startTime: bar * 2.0, duration: 1.8, trackIndex: 2, chorusMix: 0.6 });
      }
      // Track 2 (440Hz): Fast, shimmering horizontal arpeggio pattern
      for (let i = 0; i < 32; i += 2) {
        demoSequence.push({ ...pluck, id: `demo-${idCounter++}`, startTime: i * 0.25 + 0.125, duration: 0.1, trackIndex: 1, delayMix: 0.4 });
      }
      // Track 1 (880Hz): High-pitched retro laser effects to divide bars
      [1.875, 3.875, 5.875, 7.875].forEach((t, idx) => {
        demoSequence.push({ ...laser, id: `demo-${idCounter++}`, startTime: t, trackIndex: 0, pan: idx % 2 === 0 ? -0.5 : 0.5 });
      });
    }
    else if (type === 'ambient') {
      // Track 5 (55Hz): Generative, deep drones acting as slow root points
      demoSequence.push({ ...pad, id: `demo-${idCounter++}`, startTime: 0.0, duration: 3.5, trackIndex: 4, reverbMix: 0.9 });
      demoSequence.push({ ...pad, id: `demo-${idCounter++}`, startTime: 4.0, duration: 3.5, trackIndex: 4, reverbMix: 0.9, pan: -0.3 });
      // Track 4 (110Hz): Counter-balancing low drone movement
      demoSequence.push({ ...pad, id: `demo-${idCounter++}`, startTime: 2.0, duration: 4.0, trackIndex: 3, reverbMix: 0.8, pan: 0.3 });
      // Track 3 (220Hz): Soft ambient chord pulse
      [0.5, 2.5, 4.5, 6.5].forEach(t => {
        demoSequence.push({ ...pad, id: `demo-${idCounter++}`, startTime: t, duration: 1.2, trackIndex: 2, chorusMix: 0.5 });
      });
      // Track 2 (440Hz): Sparse, echoed melodic pluck reflections
      const reflectivePlucks = [1.0, 1.75, 3.25, 5.0, 5.75, 7.25];
      reflectivePlucks.forEach((t, idx) => {
        demoSequence.push({ ...pluck, id: `demo-${idCounter++}`, startTime: t, duration: 0.4, trackIndex: 1, delayMix: 0.7, reverbMix: 0.8, pan: idx % 2 === 0 ? -0.6 : 0.6 });
      });
      // Track 1 (Noise/880Hz Bypass): Deep Kick filtered down to act as ambient pulses
      [0.0, 3.0, 4.0, 7.0].forEach(t => {
        demoSequence.push({ ...kick, id: `demo-${idCounter++}`, startTime: t, duration: 0.4, trackIndex: 0, cutoff: 400 });
      });
    }
    else if (type === 'house') {
      // Track 5 (55Hz): Sub thuds working with a classic 4-on-the-floor kick pattern
      for (let i = 0; i < 16; i += 2) {
        demoSequence.push({ ...kick, id: `demo-${idCounter++}`, startTime: i * 0.5, duration: 0.3, trackIndex: 4 });
      }
      // Track 4 (110Hz): Bouncing Jack-style garage bass movement
      [0.25, 0.75, 1.25, 2.25, 2.75, 3.25, 4.25, 5.25, 6.25, 6.75].forEach(t => {
        demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: t, duration: 0.15, trackIndex: 3, chorusMix: 0.3 });
      });
      // Track 3 (220Hz): Classic M1-style stab accents
      [0.75, 1.75, 2.75, 3.75, 4.75, 5.75, 6.75, 7.75].forEach(t => {
        demoSequence.push({ ...pluck, id: `demo-${idCounter++}`, startTime: t, duration: 0.2, trackIndex: 2, reverbMix: 0.4 });
      });
      // Track 2 (440Hz): Swirling chord elements
      for (let bar = 0; bar < 4; bar++) {
        demoSequence.push({ ...pad, id: `demo-${idCounter++}`, startTime: bar * 2.0 + 0.5, duration: 1.0, trackIndex: 1, chorusMix: 0.5 });
      }
      // Track 1 (Noise/880Hz Bypass): Crisp open/closed hat layout replacements via short snared actions
      for (let i = 0; i < 16; i++) {
        if (i % 2 !== 0) demoSequence.push({ ...snare, id: `demo-${idCounter++}`, startTime: i * 0.5, duration: 0.08, trackIndex: 0, pan: 0.2 });
      }
    }
    else if (type === 'trance') {
      // Track 5 (55Hz): Heavy driving sub foundation floor
      for (let i = 0; i < 16; i++) {
        demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: i * 0.5, duration: 0.4, trackIndex: 4 });
      }
      // Track 4 (110Hz): Rolling, driving 3-take bass triplets (Classic Trance Line)
      for (let i = 0; i < 16; i++) {
        const base = i * 0.5;
        demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: base + 0.125, duration: 0.1, trackIndex: 3 });
        demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: base + 0.250, duration: 0.1, trackIndex: 3 });
        demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: base + 0.375, duration: 0.1, trackIndex: 3 });
      }
      // Track 3 (220Hz): Epic background wall pads
      for (let bar = 0; bar < 2; bar++) {
        demoSequence.push({ ...pad, id: `demo-${idCounter++}`, startTime: bar * 4.0, duration: 3.8, trackIndex: 2, reverbMix: 0.8 });
      }
      // Track 2 (440Hz): Euphoric breakdown delay elements
      for (let i = 0; i < 16; i++) {
        demoSequence.push({ ...pluck, id: `demo-${idCounter++}`, startTime: i * 0.5, duration: 0.15, trackIndex: 1, delayMix: 0.6 });
      }
      // Track 1 (Noise/880Hz Bypass): Huge snare accents to build energy drops
      [3.5, 3.75, 7.5, 7.75].forEach(t => {
        demoSequence.push({ ...snare, id: `demo-${idCounter++}`, startTime: t, duration: 0.2, trackIndex: 0, reverbMix: 0.5 });
      });
    }
    else if (type === 'dnb') {
      // Track 5 (55Hz): Heavy, long sub-bass notes sliding under the fast breaks
      [0.0, 1.5, 2.75, 4.0, 5.5, 6.75].forEach(t => {
        demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: t, duration: 0.8, trackIndex: 4, distortionMix: 0.3, glideTime: 0.15 });
      });
      // Track 4 (110Hz): Fast rhythmic bass stabs emphasizing the complex syncopation
      const bassStabs = [0.75, 1.25, 2.25, 3.5, 4.75, 5.25, 6.25, 7.5];
      bassStabs.forEach(t => {
        demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: t, duration: 0.15, trackIndex: 3 });
      });
      // Track 3 (220Hz): Atmospheric mid-range pads providing space
      for (let bar = 0; bar < 2; bar++) {
        demoSequence.push({ ...pad, id: `demo-${idCounter++}`, startTime: bar * 4.0, duration: 3.5, trackIndex: 2, reverbMix: 0.6 });
      }
      // Track 2 (440Hz): Rapid, intricate Liquid-style arpeggiated rolls
      for (let i = 0; i < 32; i++) {
        if (i % 3 === 0 || i % 7 === 0) {
          demoSequence.push({ ...pluck, id: `demo-${idCounter++}`, startTime: i * 0.25, duration: 0.1, trackIndex: 1, delayMix: 0.4 });
        }
      }
      // Track 1 (Noise/880Hz Bypass): High Speed Liquid Drum Break (Kick & Snare split)
      const dnbKicks = [0.0, 0.75, 2.0, 2.5, 4.0, 4.75, 6.0, 6.5];
      const dnbSnares = [0.5, 1.5, 2.25, 3.5, 4.5, 5.5, 6.25, 7.5];
      
      dnbKicks.forEach(t => demoSequence.push({ ...kick, id: `demo-${idCounter++}`, startTime: t, trackIndex: 0 }));
      dnbSnares.forEach(t => demoSequence.push({ ...snare, id: `demo-${idCounter++}`, startTime: t, trackIndex: 0 }));
    }
    else if (type === 'lofi') {
      // Track 5 (55Hz): Relaxed, warm electric sub groove nodes
      [0.0, 1.0, 2.0, 3.5, 4.0, 5.0, 6.0, 7.5].forEach(t => {
        demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: t, duration: 0.4, trackIndex: 4, cutoff: 400 });
      });
      // Track 4 (110Hz): Lazy walking counter-bass notes
      [0.5, 1.5, 2.5, 4.5, 5.5, 6.5].forEach(t => {
        demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: t + 0.25, duration: 0.2, trackIndex: 3 });
      });
      // Track 3 (220Hz): Dusty, highly filtered Rhodes-style backing chords
      for (let bar = 0; bar < 4; bar++) {
        demoSequence.push({ ...pad, id: `demo-${idCounter++}`, startTime: bar * 2.0, duration: 1.6, trackIndex: 2, chorusMix: 0.5, reverbMix: 0.6 });
      }
      // Track 2 (440Hz): Nostalgic, laidback melodic pluck motifs
      const lofiMelody = [0.5, 1.25, 2.5, 3.0, 4.5, 5.25, 6.5, 7.0];
      lofiMelody.forEach((t, i) => {
        demoSequence.push({ ...pluck, id: `demo-${idCounter++}`, startTime: t, duration: 0.3, trackIndex: 1, chorusMix: 0.4, pan: i % 2 === 0 ? -0.2 : 0.2 });
      });
      // Track 1 (Noise/880Hz Bypass): Unquantized lazy kick-snare patterns
      [0.0, 1.2, 2.0, 3.2, 4.0, 5.2, 6.0, 7.2].forEach(t => demoSequence.push({ ...kick, id: `demo-${idCounter++}`, startTime: t, trackIndex: 0 }));
      [1.0, 3.0, 5.0, 7.0].forEach(t => demoSequence.push({ ...snare, id: `demo-${idCounter++}`, startTime: t, trackIndex: 0, cutoff: 2000 }));
    }
    else if (type === 'synthpop') {
      // Track 5 (55Hz): Pumping, straight eighth-note electro bassline drive
      for (let i = 0; i < 16; i++) {
        demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: i * 0.5, duration: 0.25, trackIndex: 4, distortionMix: 0.15 });
      }
      // Track 4 (110Hz): Offbeat mid-frequency bass layers for standard pop energy
      for (let i = 0; i < 16; i++) {
        demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: i * 0.5 + 0.25, duration: 0.2, trackIndex: 3 });
      }
      // Track 3 (220Hz): Bright vintage chorus string pads
      for (let bar = 0; bar < 2; bar++) {
        demoSequence.push({ ...pad, id: `demo-${idCounter++}`, startTime: bar * 4.0, duration: 3.75, trackIndex: 2, chorusMix: 0.7 });
      }
      // Track 2 (440Hz): Catchy, syncopated lead hooks
      const popMelody = [0.0, 0.75, 1.5, 2.0, 2.5, 3.25, 4.0, 4.75, 5.5, 6.0, 6.5, 7.25];
      popMelody.forEach(t => {
        demoSequence.push({ ...pluck, id: `demo-${idCounter++}`, startTime: t, duration: 0.22, trackIndex: 1, delayMix: 0.3 });
      });
      // Track 1 (Noise/880Hz Bypass): Consistent LINN-style 4/4 electronic drum mapping
      for (let i = 0; i < 16; i++) {
        if (i % 2 === 0) demoSequence.push({ ...kick, id: `demo-${idCounter++}`, startTime: i * 0.5, trackIndex: 0 });
        if (i % 4 === 2) demoSequence.push({ ...snare, id: `demo-${idCounter++}`, startTime: i * 0.5, trackIndex: 0, reverbMix: 0.4 });
      }
    }

    // --- TRACK PITCH INTEGRATION MATRIX LAYER ---
    const trackFrequencies = [880.00, 440.00, 220.00, 110.00, 55.00];
    const fineTunedSequence = demoSequence.map(note => {
      if (note.waveform === 'noise') return note;
      return {
        ...note,
        frequency: trackFrequencies[note.trackIndex] ?? note.frequency
      };
    });

    this.sequence.set(fineTunedSequence);
  }
}