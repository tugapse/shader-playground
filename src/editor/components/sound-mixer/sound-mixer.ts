import { Component, ChangeDetectionStrategy, ViewChild, ElementRef, signal, computed, OnDestroy, AfterViewInit, inject } from '@angular/core';
import { SynthPreset, SynthNote } from '../../models/synth.types';
import { PresetListComponent } from './components/preset-list/preset-list.component';
import { OscilloscopeComponent } from './components/oscilloscope/oscilloscope.component';
import { SoundDesignerComponent } from '../sound-designer/sound-designer.component';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'editor-sound-mixer',
  standalone: true,
  imports: [PresetListComponent, OscilloscopeComponent, SoundDesignerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sound-mixer.html',
  styleUrl: './sound-mixer.scss'
})
export class SoundMixerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('playhead') playheadRef!: ElementRef<HTMLDivElement>;
  @ViewChild('timelineContainer') timelineRef!: ElementRef<HTMLDivElement>;

  private audioService = inject(AudioService);

  pixelsPerSecond = signal(150); 
  readonly trackHeight = 72;
  readonly rulerHeight = 32;
  readonly trackHeaderWidth = 96; 
  readonly numTracks = 5;
  readonly snapResolution = 0.1; 

  tracks = Array.from({ length: this.numTracks }, (_, i) => ({ id: i }));

  readonly presetColors = [
    'bg-rose-500 border-rose-400', 'bg-amber-500 border-amber-400', 'bg-sky-500 border-sky-400',
    'bg-indigo-500 border-indigo-400', 'bg-emerald-500 border-emerald-400', 'bg-purple-500 border-purple-400',
    'bg-fuchsia-500 border-fuchsia-400', 'bg-cyan-500 border-cyan-400'
  ];

  presets = signal<SynthPreset[]>([
    { id: 'p1', name: 'Deep Kick', waveform: 'sine', frequency: 50, cutoff: 200, duration: 0.3, colorClass: 'bg-rose-500 border-rose-400', delayMix: 0, lfoRate: 0, lfoDepth: 0, reverbMix: 0, distortionMix: 0.2, pan: 0, chorusMix: 0, glideTime: 0 },
    { id: 'p2', name: 'White Noise Snare', waveform: 'noise', frequency: 1000, cutoff: 8000, duration: 0.15, colorClass: 'bg-amber-500 border-amber-400', delayMix: 0, lfoRate: 0, lfoDepth: 0, reverbMix: 0.3, distortionMix: 0, pan: 0, chorusMix: 0, glideTime: 0 },
    { id: 'p3', name: 'Pluck Synth', waveform: 'sawtooth', frequency: 440, cutoff: 1500, duration: 0.2, colorClass: 'bg-sky-500 border-sky-400', delayMix: 0.3, lfoRate: 0, lfoDepth: 0, reverbMix: 0.2, distortionMix: 0, pan: 0, chorusMix: 0.4, glideTime: 0 },
    { id: 'p4', name: 'Acid Bass', waveform: 'square', frequency: 65, cutoff: 800, duration: 0.8, colorClass: 'bg-indigo-500 border-indigo-400', delayMix: 0, lfoRate: 0, lfoDepth: 0, reverbMix: 0, distortionMix: 0.6, pan: 0, chorusMix: 0, glideTime: 0.1 },
    { id: 'p5', name: 'Laser FX', waveform: 'sawtooth', frequency: 1200, cutoff: 6000, duration: 0.4, colorClass: 'bg-emerald-500 border-emerald-400', delayMix: 0.2, lfoRate: 15, lfoDepth: 200, reverbMix: 0.5, distortionMix: 0.1, pan: 0, chorusMix: 0.5, glideTime: 0 },
    { id: 'p6', name: 'Pad Chord', waveform: 'sine', frequency: 261.63, cutoff: 1000, duration: 2.0, colorClass: 'bg-purple-500 border-purple-400', delayMix: 0, lfoRate: 4, lfoDepth: 8, reverbMix: 0.8, distortionMix: 0, pan: 0, chorusMix: 0.8, glideTime: 0.5 }
  ]);

  sequence = signal<SynthNote[]>([]);
  isDesignerOpen = signal(false);
  editingPresetId = signal<string | null>(null);
  editingTimelineNoteId = signal<string | null>(null); 
  designerDraft = signal<SynthPreset>(this.getDefaultPreset());
  
  designerTitle = computed(() => {
    if (this.editingTimelineNoteId()) return 'Edit Timeline Note';
    if (this.editingPresetId()) {
      const presetName = this.presets().find(p => p.id === this.editingPresetId())?.name;
      return `Edit: ${presetName || 'Preset'}`;
    }
    return 'Create New Sound';
  });
  
  isExporting = signal(false);

  isPlaying = false;
  isPaused = false;
  private playbackTime = 0; 
  private playStartTime = 0; 
  private activeNodes: (OscillatorNode | AudioBufferSourceNode)[] = []; 

  private dragPayload: { type: 'new' | 'existing', data: any } | null = null;
  private audioCtx: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private playheadAnimationId: number | null = null;
  private cachedReverbIR: AudioBuffer | null = null;
  private cachedNoiseBuffer: AudioBuffer | null = null;
  private lastFreqByTrack: Record<number, number> = {};

  private sharedReverbBus: ConvolverNode | null = null;
  private sharedDelayBus: DelayNode | null = null;

  timelineWidth = computed(() => {
    const seq = this.sequence();
    const maxTime = seq.reduce((max, note) => Math.max(max, note.startTime + note.duration), 5);
    return (maxTime * this.pixelsPerSecond()) + this.trackHeaderWidth + 200; 
  });

  rulerTicks = computed(() => {
    const maxSeconds = Math.max(16, Math.ceil((this.timelineWidth() - this.trackHeaderWidth) / this.pixelsPerSecond()));
    return Array.from({ length: maxSeconds + 1 }, (_, i) => i);
  });

  ngAfterViewInit() {
    this.loadDemoSong('techno');
  }

  ngOnDestroy() {
    this.stopSequence();
    if (this.audioCtx) this.audioCtx.close();
  }

  gridPattern() { return `linear-gradient(to right, rgba(51, 65, 85, 0.5) 1px, transparent 1px)`; }

  updateZoom(event: Event) { this.pixelsPerSecond.set(Number((event.target as HTMLInputElement).value)); }

  getDefaultPreset(): SynthPreset {
    return {
      id: crypto.randomUUID(), name: 'New Sound', waveform: 'sawtooth', frequency: 440, cutoff: 2000, duration: 0.5,
      colorClass: this.presetColors[2], delayMix: 0, lfoRate: 5, lfoDepth: 0, reverbMix: 0, distortionMix: 0, pan: 0, chorusMix: 0, glideTime: 0
    };
  }

  openDesigner(preset?: SynthPreset) {
    this.editingTimelineNoteId.set(null); 
    if (preset) {
      this.editingPresetId.set(preset.id);
      this.designerDraft.set({ ...preset });
    } else {
      this.editingPresetId.set(null);
      this.designerDraft.set(this.getDefaultPreset());
    }
    this.isDesignerOpen.set(true);
  }

  openDesignerForTimelineNote(note: SynthNote) {
    this.editingPresetId.set(null);
    this.editingTimelineNoteId.set(note.id);
    this.designerDraft.set({ ...note }); 
    this.isDesignerOpen.set(true);
  }

  closeDesigner() { 
    this.isDesignerOpen.set(false); 
    this.editingTimelineNoteId.set(null);
    this.editingPresetId.set(null);
  }

  savePreset(draft: SynthPreset) {
    if (this.editingTimelineNoteId()) {
      this.sequence.update(seq => seq.map(note => 
        note.id === this.editingTimelineNoteId() ? { ...note, ...draft } : note
      ));
    } 
    else if (this.editingPresetId()) {
      this.presets.update(list => list.map(p => p.id === draft.id ? draft : p));
      this.sequence.update(seq => seq.map(note => 
        note.name === draft.name ? { ...note, ...draft, id: note.id, startTime: note.startTime, trackIndex: note.trackIndex } : note
      ));
    } 
    else {
      this.presets.update(list => [...list, draft]);
    }
    this.closeDesigner();
  }
  
  onDragStartPreset(event: DragEvent, preset: SynthPreset) {
    this.dragPayload = { type: 'new', data: preset };
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('text/plain', preset.name);
    }
  }

  onDragStartExistingNote(event: DragEvent, note: SynthNote) {
    this.dragPayload = { type: 'existing', data: note };
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', note.id);
      setTimeout(() => { (event.target as HTMLElement).style.opacity = '0.4'; }, 0);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); 
    if (event.dataTransfer) event.dataTransfer.dropEffect = this.dragPayload?.type === 'existing' ? 'move' : 'copy';
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (!this.dragPayload || !this.timelineRef) return;

    const rect = this.timelineRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left + this.timelineRef.nativeElement.scrollLeft;
    const y = event.clientY - rect.top + this.timelineRef.nativeElement.scrollTop;

    const rawTime = (x - this.trackHeaderWidth) / this.pixelsPerSecond();
    const snappedTime = Math.max(0, Math.round(rawTime / this.snapResolution) * this.snapResolution);
    const trackIndex = Math.max(0, Math.min(this.numTracks - 1, Math.floor((y - this.rulerHeight) / this.trackHeight)));

    if (this.dragPayload.type === 'new') {
      const newNote: SynthNote = { ...(this.dragPayload.data as SynthPreset), id: crypto.randomUUID(), startTime: snappedTime, trackIndex: trackIndex };
      this.sequence.update(s => [...s, newNote]);
    } else if (this.dragPayload.type === 'existing') {
      const existingNote = this.dragPayload.data as SynthNote;
      this.sequence.update(s => s.map(n => n.id === existingNote.id ? { ...n, startTime: snappedTime, trackIndex: trackIndex } : n));
      const el = document.querySelector(`[draggable="true"]`); 
      if (el) (el as HTMLElement).style.opacity = '1';
    }
    this.dragPayload = null;
  }

  onRulerClick(event: MouseEvent) {
    const container = this.timelineRef.nativeElement;
    const rect = container.getBoundingClientRect();
    const clickX = event.clientX - rect.left + container.scrollLeft;
    const relativeX = clickX - this.trackHeaderWidth;
    if (relativeX < 0) return;

    const rawTime = relativeX / this.pixelsPerSecond();
    const snappedTime = Math.max(0, Math.round(rawTime / this.snapResolution) * this.snapResolution);
    
    this.seekTo(snappedTime);
  }

  seekTo(time: number) {
    const wasPlaying = this.isPlaying && !this.isPaused;
    
    this.activeNodes.forEach(node => { try { node.stop(); } catch (e) {} });
    this.activeNodes = [];
    if (this.playheadAnimationId) cancelAnimationFrame(this.playheadAnimationId);

    this.playbackTime = time;
    this.updatePlayheadVisual(time);

    if (wasPlaying) {
      this.isPlaying = false;
      this.isPaused = false;
      this.playSequence();
    }
  }

  private updatePlayheadVisual(time: number) {
    if (!this.playheadRef) return;
    const playhead = this.playheadRef.nativeElement;
    playhead.style.display = 'block';
    const xPosition = time * this.pixelsPerSecond();
    playhead.style.transform = `translateX(${xPosition}px)`;
  }

  private initAudio() {
    this.audioService.init();
    this.audioCtx = this.audioService.getAudioContext();
    this.analyser = this.audioService.getAnalyserNode();
    this.masterGain = this.audioService.getMasterGainNode();

    if (this.audioCtx && !this.sharedReverbBus) {
      this.sharedReverbBus = this.audioCtx.createConvolver();
      this.sharedReverbBus.buffer = this.getReverbIR(this.audioCtx);
      this.sharedReverbBus.connect(this.masterGain!);

      this.sharedDelayBus = this.audioCtx.createDelay();
      this.sharedDelayBus.delayTime.value = 0.25;
      const delayFeedback = this.audioCtx.createGain();
      delayFeedback.gain.value = 0.4;
      
      this.sharedDelayBus.connect(delayFeedback);
      delayFeedback.connect(this.sharedDelayBus);
      this.sharedDelayBus.connect(this.masterGain!);
    }
  }

  private getNoiseBuffer(ctx: BaseAudioContext): AudioBuffer {
    if (this.cachedNoiseBuffer && this.cachedNoiseBuffer.sampleRate === ctx.sampleRate) return this.cachedNoiseBuffer;
    const bufferSize = ctx.sampleRate * 2.0; 
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    this.cachedNoiseBuffer = buffer;
    return buffer;
  }

  private getReverbIR(ctx: BaseAudioContext): AudioBuffer {
    if (this.cachedReverbIR && this.cachedReverbIR.sampleRate === ctx.sampleRate) return this.cachedReverbIR;
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
    this.cachedReverbIR = impulse;
    return impulse;
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = i * 2 / n_samples - 1;
      curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private buildAudioGraph(
    note: SynthNote, 
    globalStartTime: number, 
    ctx: BaseAudioContext, 
    destination: AudioNode, 
    playheadOffset = 0,
    customReverbBus?: AudioNode,
    customDelayBus?: AudioNode
  ) {
    const noteStart = globalStartTime + Math.max(0, note.startTime - playheadOffset);
    const isRemainder = note.startTime < playheadOffset;
    const noteDuration = isRemainder 
      ? (note.startTime + note.duration - playheadOffset) 
      : note.duration;
    
    if (noteDuration <= 0) return;

    const noteEnd = noteStart + noteDuration;
    
    const filter = ctx.createBiquadFilter();
    const envelopeGain = ctx.createGain();
    const panner = ctx.createStereoPanner();
    panner.pan.value = note.pan || 0;

    let source: OscillatorNode | AudioBufferSourceNode;

    if (note.waveform === 'noise') {
      source = ctx.createBufferSource();
      source.buffer = this.getNoiseBuffer(ctx);
      source.loop = true;
      filter.type = 'highpass'; 
    } else {
      source = ctx.createOscillator();
      source.type = note.waveform;
      filter.type = 'lowpass';
      
      const prevFreq = this.lastFreqByTrack[note.trackIndex];
      if (note.name === 'Laser FX') {
        source.frequency.setValueAtTime(note.frequency, noteStart);
        source.frequency.exponentialRampToValueAtTime(50, noteStart + noteDuration);
      } else if (note.glideTime > 0 && prevFreq) {
        source.frequency.setValueAtTime(prevFreq, noteStart);
        source.frequency.exponentialRampToValueAtTime(note.frequency, noteStart + note.glideTime);
      } else {
        source.frequency.value = note.frequency;
      }
      this.lastFreqByTrack[note.trackIndex] = note.frequency;

      if (note.lfoDepth > 0) {
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = note.lfoRate;
        lfoGain.gain.value = note.lfoDepth; 
        lfo.connect(lfoGain);
        lfoGain.connect(source.frequency);
        lfo.start(noteStart);
        lfo.stop(noteEnd + 0.1);
        if (ctx instanceof AudioContext) this.activeNodes.push(lfo);
      }
    }

    filter.frequency.value = note.cutoff;
    filter.Q.value = note.name.includes('Bass') ? 10 : 2;

    const attackTime = isRemainder ? 0.01 : (note.name.includes('Pad') ? 0.5 : 0.02);
    const releaseTime = note.name.includes('Pad') ? 1.0 : 0.1;
    
    envelopeGain.gain.setValueAtTime(0, noteStart);
    envelopeGain.gain.linearRampToValueAtTime(0.8, noteStart + attackTime);
    envelopeGain.gain.setValueAtTime(0.8, Math.max(noteStart + attackTime, noteEnd - releaseTime));
    envelopeGain.gain.linearRampToValueAtTime(0.001, noteEnd);

    source.connect(filter);
    filter.connect(envelopeGain);
    envelopeGain.connect(panner);
    panner.connect(destination); 

    const targetReverb = customReverbBus || this.sharedReverbBus;
    const targetDelay = customDelayBus || this.sharedDelayBus;
    this.applyEffects(note, panner, destination, ctx, noteStart, noteEnd, targetReverb, targetDelay);

    source.start(noteStart);
    source.stop(noteEnd + 0.1);
    if (ctx instanceof AudioContext) this.activeNodes.push(source);
  }

  private applyEffects(
    note: SynthNote, 
    panner: StereoPannerNode, 
    destination: AudioNode, 
    ctx: BaseAudioContext, 
    noteStart: number, 
    noteEnd: number,
    reverbBus: AudioNode | null,
    delayBus: AudioNode | null
  ) {
    if (note.delayMix && note.delayMix > 0 && delayBus) {
      const delaySendGain = ctx.createGain();
      delaySendGain.gain.value = note.delayMix * 0.6;
      panner.connect(delaySendGain);
      delaySendGain.connect(delayBus);
    }

    if (note.reverbMix && note.reverbMix > 0 && reverbBus) {
      const reverbSendGain = ctx.createGain();
      reverbSendGain.gain.value = note.reverbMix * 0.7;
      panner.connect(reverbSendGain);
      reverbSendGain.connect(reverbBus);
    }

    if (note.distortionMix && note.distortionMix > 0) {
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(note.distortionMix * 100); 
      shaper.oversample = '4x';
      const distGain = ctx.createGain();
      distGain.gain.value = note.distortionMix * 0.5; 
      panner.connect(shaper);
      shaper.connect(distGain);
      distGain.connect(destination);
    }

    if (note.chorusMix && note.chorusMix > 0) {
      const chorusDelay = ctx.createDelay();
      chorusDelay.delayTime.value = 0.03; 
      const chorusLFO = ctx.createOscillator();
      const chorusLfoGain = ctx.createGain();
      chorusLFO.frequency.value = 1.5;
      chorusLfoGain.gain.value = 0.005;
      
      chorusLFO.connect(chorusLfoGain);
      chorusLfoGain.connect(chorusDelay.delayTime);
      
      const chorusOut = ctx.createGain();
      chorusOut.gain.value = note.chorusMix;
      
      panner.connect(chorusDelay);
      chorusDelay.connect(chorusOut);
      chorusOut.connect(destination);
      
      chorusLFO.start(noteStart);
      chorusLFO.stop(noteEnd + 0.1);
      if (ctx instanceof AudioContext) this.activeNodes.push(chorusLFO);
    }
  }

  previewPreset(preset: SynthPreset) {
    this.initAudio();
    this.lastFreqByTrack = {};
    this.buildAudioGraph({ ...preset, id: 'preview', startTime: 0, trackIndex: 0 }, this.audioCtx!.currentTime, this.audioCtx!, this.masterGain!);
  }

  playSequence() {
    if (this.sequence().length === 0) return;
    this.initAudio();

    if (this.isPlaying && !this.isPaused) return; 
    
    this.isPlaying = true;
    this.isPaused = false;
    this.lastFreqByTrack = {}; 
    
    const globalStartTime = this.audioCtx!.currentTime + 0.1; 
    this.playStartTime = globalStartTime; 

    const maxTime = this.sequence().reduce((max, note) => Math.max(max, note.startTime + note.duration), 0);

    const sortedSeq = [...this.sequence()].sort((a, b) => a.startTime - b.startTime);
    sortedSeq.forEach(note => {
      this.buildAudioGraph(note, globalStartTime, this.audioCtx!, this.masterGain!, this.playbackTime);
    });

    this.animatePlayhead(globalStartTime, maxTime);
  }

  pauseSequence() {
    if (!this.isPlaying || this.isPaused) return;

    this.isPaused = true;
    
    const elapsed = this.audioCtx!.currentTime - this.playStartTime;
    this.playbackTime += Math.max(0, elapsed);

    this.activeNodes.forEach(node => { try { node.stop(); } catch (e) {} });
    this.activeNodes = [];
    
    if (this.playheadAnimationId) cancelAnimationFrame(this.playheadAnimationId);
  }

  stopSequence() {
    this.isPlaying = false;
    this.isPaused = false;
    this.playbackTime = 0;

    this.activeNodes.forEach(node => { try { node.stop(); } catch (e) {} });
    this.activeNodes = [];
    
    if (this.playheadRef) {
      this.playheadRef.nativeElement.style.display = 'none';
      this.playheadRef.nativeElement.style.transform = `translateX(0px)`;
    }
    if (this.playheadAnimationId) cancelAnimationFrame(this.playheadAnimationId);
  }

  private animatePlayhead(startTime: number, totalDuration: number) {
    if (!this.playheadRef || !this.audioCtx) return;
    const playhead = this.playheadRef.nativeElement;
    playhead.style.display = 'block';

    const baseOffset = this.playbackTime;

    const update = () => {
      if (!this.isPlaying || this.isPaused) return;
      
      const elapsed = this.audioCtx!.currentTime - startTime;
      const currentPos = baseOffset + elapsed;
      
      if (currentPos >= totalDuration + 0.2) {
        this.stopSequence();
        return;
      }

      const clampedPos = Math.max(0, currentPos);
      const xPosition = clampedPos * this.pixelsPerSecond();
      playhead.style.transform = `translateX(${xPosition}px)`;

      if (this.timelineRef) {
         const container = this.timelineRef.nativeElement;
         const playheadAbsoluteX = xPosition + this.trackHeaderWidth;
         if (playheadAbsoluteX > container.scrollLeft + container.clientWidth - 100) {
            container.scrollLeft = playheadAbsoluteX - container.clientWidth + 150;
         }
      }
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
      const maxTime = seq.reduce((max, note) => Math.max(max, note.startTime + note.duration), 0) + 3;
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

      const sortedSeq = [...seq].sort((a, b) => a.startTime - b.startTime);
      sortedSeq.forEach(note => this.buildAudioGraph(note, 0, offlineCtx, offlineMaster, 0, offlineReverb, offlineDelay));

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
      alert("Failed to render WAV. Check console.");
    } finally {
      this.isExporting.set(false);
    }
  }

  private audioBufferToWav(abuffer: AudioBuffer) {
    let numOfChan = abuffer.numberOfChannels,
        length = abuffer.length * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [], i, sample,
        offset = 0,
        pos = 0;

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

  removeNote(id: string) { this.sequence.update(s => s.filter(n => n.id !== id)); }

  clearTimeline() {
    if (confirm('Clear all notes?')) {
      this.sequence.set([]);
      this.stopSequence();
    }
  }

  loadDemoSong(type: string = 'techno') {
    this.stopSequence();
    const presets = this.presets();
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
      const chords = [ [174.61, 207.65, 261.63, 349.23], [138.59, 174.61, 207.65, 277.18], [155.56, 196.00, 233.08, 311.13], [130.81, 155.56, 196.00, 261.63] ];

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