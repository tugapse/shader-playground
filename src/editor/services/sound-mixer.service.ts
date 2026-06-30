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
      for (let i = 0; i < 16; i++) demoSequence.push({ ...kick, id: `demo-${idCounter++}`, startTime: i * 0.5, trackIndex: 0 });
      for (let i = 0; i < 8; i++) demoSequence.push({ ...snare, id: `demo-${idCounter++}`, startTime: i * 1.0 + 0.5, trackIndex: 1, pan: (i%2===0?-0.3:0.3) });
      
      const bassFreqs = [65.41, 65.41, 77.78, 87.31, 65.41, 65.41, 58.27, 49.00]; 
      for (let i = 0; i < 16; i++) {
        demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: i * 0.5 + 0.25, frequency: bassFreqs[i % 8], duration: 0.2, trackIndex: 2 });
      }
      
      [1.75, 3.75, 5.75, 7.25, 7.75].forEach((t, index) => {
        demoSequence.push({ ...laser, id: `demo-${idCounter++}`, startTime: t, trackIndex: 4, pan: (index%2===0?-0.8:0.8) });
      });
    } 
    else if (type === 'synthwave') {
      const chords = [
        [220.00, 261.63, 329.63, 440.00], [196.00, 246.94, 293.66, 392.00], 
        [174.61, 220.00, 261.63, 349.23], [164.81, 196.00, 246.94, 329.63] 
      ];

      for (let bar = 0; bar < 4; bar++) {
        const start = bar * 2.0; 
        const chord = chords[bar];

        demoSequence.push({ ...pad, id: `demo-${idCounter++}`, startTime: start, frequency: chord[0] / 2, duration: 2.0, trackIndex: 4 });

        for (let beat = 0; beat < 4; beat++) { 
          const beatStart = start + beat * 0.5;
          demoSequence.push({ ...kick, id: `demo-${idCounter++}`, startTime: beatStart, trackIndex: 0 });
          if (beat % 2 !== 0) demoSequence.push({ ...snare, id: `demo-${idCounter++}`, startTime: beatStart, trackIndex: 1 });
          
          demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: beatStart + 0.25, frequency: chord[0] / 2, duration: 0.2, trackIndex: 2 });

          for(let i = 0; i < 4; i++) {
             demoSequence.push({ ...pluck, id: `demo-${idCounter++}`, startTime: beatStart + i * 0.125, frequency: chord[i], duration: 0.1, trackIndex: 3, glideTime: 0.05 });
          }
        }
      }
    }
    else if (type === 'ambient') {
      const cMaj9 = [130.81, 196.00, 246.94, 293.66]; 
      cMaj9.forEach(freq => demoSequence.push({ ...pad, id: `demo-${idCounter++}`, startTime: 0, frequency: freq, duration: 4.0, trackIndex: 4, pan: -0.5 }));
      const fMaj7 = [87.31, 174.61, 220.00, 261.63]; 
      fMaj7.forEach(freq => demoSequence.push({ ...pad, id: `demo-${idCounter++}`, startTime: 4.0, frequency: freq, duration: 4.0, trackIndex: 4, pan: 0.5 }));

      [0, 0.4, 4.0, 4.4].forEach(t => demoSequence.push({ ...kick, id: `demo-${idCounter++}`, startTime: t, frequency: 40, duration: 0.6, trackIndex: 0 }));

      const ambientPlucks = [ { t: 1.0, f: 523.25 }, { t: 2.5, f: 783.99 }, { t: 3.0, f: 987.77 }, { t: 5.0, f: 698.46 }, { t: 6.5, f: 1046.50 }, { t: 7.25, f: 880.00 } ];
      ambientPlucks.forEach((p, index) => {
        demoSequence.push({ ...pluck, id: `demo-${idCounter++}`, startTime: p.t, frequency: p.f, duration: 0.4, trackIndex: 3, delayMix: 0.7, reverbMix: 0.9, pan: index%2===0?-0.6:0.6 }); 
      });
    }
    else if (type === 'house') {
      for (let i = 0; i < 16; i++) demoSequence.push({ ...kick, id: `demo-${idCounter++}`, startTime: i * 0.5, trackIndex: 0 });
      for (let i = 0; i < 8; i++) demoSequence.push({ ...snare, id: `demo-${idCounter++}`, startTime: i * 1.0 + 0.5, trackIndex: 1, pan: 0.1 });

      for (let bar = 0; bar < 4; bar++) {
        const start = bar * 2.0;
        const root = bar < 2 ? 82.41 : 110.00; 
        
        [0.25, 0.75, 1.25, 1.75].forEach(t => {
           demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: start + t, frequency: root, duration: 0.15, trackIndex: 2 });
        });
        
        const chord = bar < 2 ? [164.81, 196.00, 246.94, 293.66] : [220.00, 261.63, 329.63, 392.00]; 
        
        [0.5, 1.5].forEach(t => {
           chord.forEach(freq => {
              demoSequence.push({ ...pluck, id: `demo-${idCounter++}`, startTime: start + t + 0.25, frequency: freq, duration: 0.2, trackIndex: 3, pan: bar%2===0?-0.4:0.4 });
           });
        });
      }
    }
    else if (type === 'trance') {
      const chords = [ 
        [174.61, 207.65, 261.63, 349.23], 
        [138.59, 174.61, 207.65, 277.18], 
        [155.56, 196.00, 233.08, 311.13], 
        [130.81, 155.56, 196.00, 261.63] 
      ];

      for (let bar = 0; bar < 4; bar++) {
        const start = bar * 2.0;
        const chord = chords[bar];
        const root = chord[0] / 2; 

        demoSequence.push({ ...pad, id: `demo-${idCounter++}`, startTime: start, frequency: root, duration: 2.0, trackIndex: 4, reverbMix: 0.8 });
        demoSequence.push({ ...pad, id: `demo-${idCounter++}`, startTime: start, frequency: chord[1], duration: 2.0, trackIndex: 4, reverbMix: 0.8 });
        
        for (let beat = 0; beat < 4; beat++) {
          const beatStart = start + beat * 0.5;
          demoSequence.push({ ...kick, id: `demo-${idCounter++}`, startTime: beatStart, trackIndex: 0 });
          
          demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: beatStart + 0.125, frequency: root, duration: 0.1, trackIndex: 2 });
          demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: beatStart + 0.250, frequency: root, duration: 0.1, trackIndex: 2 });
          demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: beatStart + 0.375, frequency: root, duration: 0.1, trackIndex: 2 });

          const arpNotes = [chord[0], chord[2], chord[1], chord[3]];
          for(let i = 0; i < 4; i++) {
             demoSequence.push({ ...pluck, id: `demo-${idCounter++}`, startTime: beatStart + i * 0.125, frequency: arpNotes[i], duration: 0.1, trackIndex: 3, delayMix: 0.6, glideTime: 0.05 });
          }
        }
      }
    }
    else if (type === 'dnb') {
      const kickPositions = [0.0, 0.75, 2.0, 2.75, 4.0, 4.75, 6.0, 6.75];
      const snarePositions = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5];
      
      kickPositions.forEach(t => demoSequence.push({ ...kick, id: `demo-${idCounter++}`, startTime: t, trackIndex: 0 }));
      snarePositions.forEach(t => demoSequence.push({ ...snare, id: `demo-${idCounter++}`, startTime: t, trackIndex: 1 }));

      const dnbBassNotes = [48.99, 48.99, 58.27, 58.27, 38.89, 38.89, 43.65, 43.65]; 
      for (let i = 0; i < 8; i++) {
        demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: i * 1.0, frequency: dnbBassNotes[i], duration: 0.9, trackIndex: 2, glideTime: 0.2, distortionMix: 0.2 });
      }

      const dnbPlucks = [392.00, 466.16, 587.33, 783.99, 587.33, 466.16, 440.00, 523.25]; 
      for (let i = 0; i < 32; i++) {
        demoSequence.push({ ...pluck, id: `demo-${idCounter++}`, startTime: i * 0.25, frequency: dnbPlucks[i % 8], duration: 0.15, trackIndex: 3, pan: (i % 2 === 0 ? -0.5 : 0.5), delayMix: 0.5 });
      }
    }
    else if (type === 'lofi') {
      const lofiKicks = [0.0, 1.2, 2.0, 3.2, 4.0, 5.2, 6.0, 7.2];
      const lofiSnares = [1.0, 3.0, 5.0, 7.0];
      
      lofiKicks.forEach(t => demoSequence.push({ ...kick, id: `demo-${idCounter++}`, startTime: t, frequency: 45, trackIndex: 0 }));
      lofiSnares.forEach(t => demoSequence.push({ ...snare, id: `demo-${idCounter++}`, startTime: t, trackIndex: 1, cutoff: 2500, reverbMix: 0.5 })); 

      const chords = [
        [130.81, 164.81, 196.00, 246.94], 
        [130.81, 164.81, 196.00, 246.94],
        [87.31, 130.81, 174.61, 220.00],  
        [87.31, 130.81, 174.61, 220.00]
      ];

      for (let bar = 0; bar < 4; bar++) {
        const start = bar * 2.0;
        chords[bar].forEach((freq, index) => {
          demoSequence.push({ ...pad, id: `demo-${idCounter++}`, startTime: start, frequency: freq, duration: 1.8, trackIndex: 4, reverbMix: 0.8, chorusMix: 0.6, pan: (index % 2 === 0 ? -0.3 : 0.3) });
        });
        
        demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: start + 0.2, frequency: chords[bar][0], duration: 1.4, trackIndex: 2, cutoff: 500, distortionMix: 0 });
      }

      const melody = [
        { t: 0.5, f: 392.00 }, { t: 0.75, f: 440.00 }, { t: 1.5, f: 493.88 },
        { t: 4.5, f: 523.25 }, { t: 4.75, f: 587.33 }, { t: 5.5, f: 659.25 }
      ];
      melody.forEach(m => {
        demoSequence.push({ ...pluck, id: `demo-${idCounter++}`, startTime: m.t, frequency: m.f, duration: 0.3, trackIndex: 3, delayMix: 0.6, reverbMix: 0.7, pan: 0.2 });
      });
    }
    else if (type === 'synthpop') {
      for (let i = 0; i < 16; i++) {
        demoSequence.push({ ...kick, id: `demo-${idCounter++}`, startTime: i * 0.5, trackIndex: 0 });
        if (i % 2 !== 0) demoSequence.push({ ...snare, id: `demo-${idCounter++}`, startTime: i * 0.5, trackIndex: 1, reverbMix: 0.4 });
      }

      const baseRoots = [97.99, 87.31, 65.41, 58.27]; 
      for (let bar = 0; bar < 4; bar++) {
        const start = bar * 2.0;
        const root = baseRoots[bar];
        for (let beat = 0; beat < 4; beat++) {
          const beatStart = start + beat * 0.5;
          demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: beatStart, frequency: root, duration: 0.2, trackIndex: 2, cutoff: 1200 });
          demoSequence.push({ ...bass, id: `demo-${idCounter++}`, startTime: beatStart + 0.25, frequency: root * 2, duration: 0.2, trackIndex: 2, cutoff: 1200 });
        }
      }

      const stringChords = [
        [196.00, 246.94, 293.66], 
        [174.61, 220.00, 261.63], 
        [130.81, 164.81, 196.00], 
        [116.54, 146.83, 174.61]  
      ];
      for (let bar = 0; bar < 4; bar++) {
        stringChords[bar].forEach(freq => {
          demoSequence.push({ ...pad, id: `demo-${idCounter++}`, startTime: bar * 2.0, frequency: freq, duration: 1.9, trackIndex: 4, chorusMix: 0.8, reverbMix: 0.5 });
        });
      }

      const leadMelody = [
        { t: 0.0, f: 587.33 }, { t: 0.5, f: 783.99 }, { t: 1.0, f: 739.99 }, { t: 1.5, f: 587.33 },
        { t: 2.0, f: 659.25 }, { t: 2.5, f: 880.00 }, { t: 3.0, f: 783.99 }, { t: 3.5, f: 659.25 },
        { t: 4.0, f: 523.25 }, { t: 4.5, f: 659.25 }, { t: 5.0, f: 587.33 }, { t: 5.5, f: 523.25 },
        { t: 6.0, f: 466.16 }, { t: 6.5, f: 587.33 }, { t: 7.0, f: 523.25 }, { t: 7.5, f: 466.16 }
      ];
      leadMelody.forEach(note => {
        demoSequence.push({ ...pluck, id: `demo-${idCounter++}`, startTime: note.t, frequency: note.f, duration: 0.45, trackIndex: 3, delayMix: 0.4, chorusMix: 0.7, pan: -0.2 });
      });
    }

    this.sequence.set(demoSequence);
  }
}