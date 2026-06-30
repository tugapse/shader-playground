import { Component, ChangeDetectionStrategy, ViewChild, ElementRef, signal, computed, OnDestroy, AfterViewInit, inject } from '@angular/core';
import { SynthPreset, SynthNote } from '../../models/synth.types';
import { PresetListComponent } from './components/preset-list/preset-list.component';
import { OscilloscopeComponent } from './components/oscilloscope/oscilloscope.component';
import { SoundDesignerComponent } from './sound-designer/sound-designer.component';
import { Icon } from "src/app/components/icon/icon";
import { SoundMixerPlaybackService } from './sound-mixer.service';

@Component({
  selector: 'editor-sound-mixer',
  standalone: true,
  imports: [PresetListComponent, OscilloscopeComponent, SoundDesignerComponent, Icon],
  providers: [SoundMixerPlaybackService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sound-mixer.html',
  styleUrl: './sound-mixer.scss'
})
export class SoundMixerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('playhead') playheadRef!: ElementRef<HTMLDivElement>;
  @ViewChild('timelineContainer') timelineRef!: ElementRef<HTMLDivElement>;

  protected playback = inject(SoundMixerPlaybackService);

  readonly pixelsPerSecond = signal(150); 
  readonly trackHeight = 72;
  readonly rulerHeight = 32;
  readonly trackHeaderWidth = 96; 
  readonly numTracks = 5;
  readonly snapResolution = 0.1; 

  tracks = Array.from({ length: this.numTracks }, (_, i) => ({ id: i }));
readonly trackFrequencies = [
  880.00, // Track 1: High Lead / Percussion Accent (A5)
  440.00, // Track 2: Mid Melodic Pluck (A4)
  220.00, // Track 3: Chord Root / Pad (A3)
  110.00, // Track 4: Low Bass Engine (A2)
  55.00   // Track 5: Deep Sub Growl (A1)
];
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

  isDesignerOpen = signal(false);
  editingPresetId = signal<string | null>(null);
  editingTimelineNoteId = signal<string | null>(null); 
  designerDraft = signal<SynthPreset>(this.getDefaultPreset());
  
  readonly dragIndicator = signal<{ left: number; top: number; width: number } | null>(null);

  designerTitle = computed(() => {
    if (this.editingTimelineNoteId()) return 'Edit Timeline Note';
    if (this.editingPresetId()) {
      const presetName = this.presets().find(p => p.id === this.editingPresetId())?.name;
      return `Edit: ${presetName || 'Preset'}`;
    }
    return 'Create New Sound';
  });

  private dragPayload: { type: 'new' | 'existing', data: any } | null = null;
  private dragOffsetX = 0;

  timelineWidth = computed(() => {
    const maxTime = Math.max(5, this.playback.totalDuration());
    return (maxTime * this.pixelsPerSecond()) + this.trackHeaderWidth + 200; 
  });

  rulerTicks = computed(() => {
    const maxSeconds = Math.max(16, Math.ceil((this.timelineWidth() - this.trackHeaderWidth) / this.pixelsPerSecond()));
    return Array.from({ length: maxSeconds + 1 }, (_, i) => i);
  });

  ngAfterViewInit() {
    this.playback.loadDemoSong('techno', this.presets());
  }

  ngOnDestroy() {
    this.playback.stopSequence();
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
      this.playback.sequence.update(seq => seq.map(note => 
        note.id === this.editingTimelineNoteId() ? { ...note, ...draft } : note
      ));
    } 
    else if (this.editingPresetId()) {
      this.presets.update(list => list.map(p => p.id === draft.id ? draft : p));
      this.playback.sequence.update(seq => seq.map(note => 
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
    this.dragOffsetX = 0;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('text/plain', preset.name);
    }
  }

  onDragStartExistingNote(event: DragEvent, note: SynthNote) {
    this.dragPayload = { type: 'existing', data: note };
    this.dragOffsetX = event.offsetX;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', note.id);
      setTimeout(() => { (event.target as HTMLElement).style.opacity = '0.4'; }, 0);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); 
    if (event.dataTransfer) event.dataTransfer.dropEffect = this.dragPayload?.type === 'existing' ? 'move' : 'copy';
    if (!this.dragPayload || !this.timelineRef) return;

    const rect = this.timelineRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left + this.timelineRef.nativeElement.scrollLeft - this.dragOffsetX;
    const y = event.clientY - rect.top + this.timelineRef.nativeElement.scrollTop;

    const rawTime = (x - this.trackHeaderWidth) / this.pixelsPerSecond();
    const snappedTime = Math.max(0, Math.round(rawTime / this.snapResolution) * this.snapResolution);
    const trackIndex = Math.max(0, Math.min(this.numTracks - 1, Math.floor((y - this.rulerHeight) / this.trackHeight)));
    const duration = this.dragPayload.data?.duration || 0.5;

    // Map dynamic frequency based on tracked index
    const targetedFreq = this.trackFrequencies[trackIndex];

    this.dragIndicator.set({
      left: (snappedTime * this.pixelsPerSecond()) + this.trackHeaderWidth,
      top: (trackIndex * this.trackHeight) + this.rulerHeight,
      width: duration * this.pixelsPerSecond()
    });

    // Option: update your console log or pass text hints to see the frequency shift
    console.log(`Targeting Track: ${trackIndex + 1} | Frequency: ${targetedFreq}Hz`);
  }

  onDragLeave() {
    this.dragIndicator.set(null);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragIndicator.set(null);
    if (!this.dragPayload || !this.timelineRef) return;

    const rect = this.timelineRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left + this.timelineRef.nativeElement.scrollLeft - this.dragOffsetX;
    const y = event.clientY - rect.top + this.timelineRef.nativeElement.scrollTop;

    const rawTime = (x - this.trackHeaderWidth) / this.pixelsPerSecond();
    const snappedTime = Math.max(0, Math.round(rawTime / this.snapResolution) * this.snapResolution);
    const trackIndex = Math.max(0, Math.min(this.numTracks - 1, Math.floor((y - this.rulerHeight) / this.trackHeight)));

    const targetFrequency = this.trackFrequencies[trackIndex];

    if (this.dragPayload.type === 'new') {
      const dataPreset = this.dragPayload.data as SynthPreset;
      const newNote: SynthNote = { 
        ...dataPreset, 
        id: crypto.randomUUID(), 
        startTime: snappedTime, 
        trackIndex: trackIndex,
        // Keep original frequency if it's white noise, otherwise overwrite with track pitch
        frequency: dataPreset.waveform === 'noise' ? dataPreset.frequency : targetFrequency
      };
      this.playback.sequence.update(s => [...s, newNote]);
    } 
    else if (this.dragPayload.type === 'existing') {
      const existingNote = this.dragPayload.data as SynthNote;
      this.playback.sequence.update(s => s.map(n => n.id === existingNote.id ? { 
        ...n, 
        startTime: snappedTime, 
        trackIndex: trackIndex,
        frequency: n.waveform === 'noise' ? n.frequency : targetFrequency
      } : n));
      
      const el = document.querySelector(`[draggable="true"]`); 
      if (el) (el as HTMLElement).style.opacity = '1';
    }
    this.dragPayload = null;
    this.dragOffsetX = 0;
  }

  onRulerClick(event: MouseEvent) {
    const container = this.timelineRef.nativeElement;
    const rect = container.getBoundingClientRect();
    const clickX = event.clientX - rect.left + container.scrollLeft;
    const relativeX = clickX - this.trackHeaderWidth;
    if (relativeX < 0) return;

    const rawTime = relativeX / this.pixelsPerSecond();
    const snappedTime = Math.max(0, Math.round(rawTime / this.snapResolution) * this.snapResolution);
    
    this.playback.seekTo(snappedTime, (t) => this.handlePlayheadFrameUpdate(t));
  }

  triggerPlay() {
    this.playback.playSequence((t) => this.handlePlayheadFrameUpdate(t));
  }

  private handlePlayheadFrameUpdate(time: number) {
    if (!this.playheadRef) return;
    const playhead = this.playheadRef.nativeElement;
    playhead.style.display = 'block';
    
    const xPosition = time * this.pixelsPerSecond();
    playhead.style.transform = `translateX(${xPosition}px)`;

    if (this.timelineRef) {
       const container = this.timelineRef.nativeElement;
       const playheadAbsoluteX = xPosition + this.trackHeaderWidth;
       if (playheadAbsoluteX > container.scrollLeft + container.clientWidth - 100) {
          container.scrollLeft = playheadAbsoluteX - container.clientWidth + 150;
       }
    }
  }

  removeNote(id: string) { this.playback.sequence.update(s => s.filter(n => n.id !== id)); }

  clearTimeline() {
    if (confirm('Clear all notes?')) {
      this.playback.sequence.set([]);
      this.playback.stopSequence();
    }
  }
}