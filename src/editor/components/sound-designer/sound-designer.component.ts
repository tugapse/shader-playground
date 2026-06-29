import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, signal, OnChanges, SimpleChanges } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SynthPreset } from '../../models/synth.types';

@Component({
  selector: 'app-sound-designer',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="designer-modal-backdrop">
      <div class="designer-modal-content">
        <div class="designer-header">
          <h3 class="designer-title">{{ title }}</h3>
          <button (click)="close.emit()" class="btn-close">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div class="designer-body">
          <div class="designer-section">
            <h4 class="section-title accent-sky">Generator & Timing</h4>
            
            <div class="form-group">
              <label class="form-label">Name</label>
              <input type="text" [value]="designerDraft().name" (input)="updateDraft('name', $event)" class="text-input">
            </div>

            <div class="form-group">
              <label class="form-label">Waveform</label>
              <div class="segmented-control">
                @for (type of ['sine', 'square', 'sawtooth', 'triangle', 'noise']; track type) {
                  <button (click)="updateDraftValue('waveform', type)" class="segmented-btn" [class.active]="designerDraft().waveform === type">
                    {{ type }}
                  </button>
                }
              </div>
            </div>

            <div class="form-group">
              <div class="label-row">
                <label class="form-label">Frequency</label>
                <span class="value-display accent-sky">{{ designerDraft().frequency }} Hz</span>
              </div>
              <input type="range" min="20" max="2000" [value]="designerDraft().frequency" (input)="updateDraftNumber('frequency', $event)" class="range-input accent-sky">
            </div>

            <div class="form-group">
              <div class="label-row">
                <label class="form-label">Filter Cutoff</label>
                <span class="value-display accent-sky">{{ designerDraft().cutoff }} Hz</span>
              </div>
              <input type="range" min="200" max="8000" [value]="designerDraft().cutoff" (input)="updateDraftNumber('cutoff', $event)" class="range-input accent-sky">
            </div>
            
            <div class="form-group">
              <div class="label-row">
                <label class="form-label">Duration</label>
                <span class="value-display accent-sky">{{ designerDraft().duration }} s</span>
              </div>
              <input type="range" min="0.1" max="4.0" step="0.1" [value]="designerDraft().duration" (input)="updateDraftNumber('duration', $event)" class="range-input accent-sky">
            </div>

            <div class="form-group">
              <div class="label-row">
                <label class="form-label">Glide / Portamento</label>
                <span class="value-display accent-sky">{{ designerDraft().glideTime }} s</span>
              </div>
              <input type="range" min="0" max="1" step="0.01" [value]="designerDraft().glideTime" (input)="updateDraftNumber('glideTime', $event)" class="range-input accent-sky">
            </div>
          </div>

          <div class="designer-section">
            <h4 class="section-title accent-indigo">Effects & Modulation</h4>
            
            <div class="form-group">
              <div class="label-row">
                <label class="form-label">Pan (L/R)</label>
                <span class="value-display accent-indigo">{{ (designerDraft().pan * 100) | number:'1.0-0' }}%</span>
              </div>
              <input type="range" min="-1" max="1" step="0.1" [value]="designerDraft().pan" (input)="updateDraftNumber('pan', $event)" class="range-input accent-indigo">
            </div>

            <div class="form-group">
              <div class="label-row">
                <label class="form-label">Distortion Mix</label>
                <span class="value-display accent-indigo">{{ (designerDraft().distortionMix * 100) | number:'1.0-0' }}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" [value]="designerDraft().distortionMix" (input)="updateDraftNumber('distortionMix', $event)" class="range-input accent-indigo">
            </div>
            
            <div class="form-group">
              <div class="label-row">
                <label class="form-label">Reverb Mix</label>
                <span class="value-display accent-indigo">{{ (designerDraft().reverbMix * 100) | number:'1.0-0' }}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" [value]="designerDraft().reverbMix" (input)="updateDraftNumber('reverbMix', $event)" class="range-input accent-indigo">
            </div>

            <div class="form-group">
              <div class="label-row">
                <label class="form-label">Delay Mix</label>
                <span class="value-display accent-indigo">{{ (designerDraft().delayMix * 100) | number:'1.0-0' }}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" [value]="designerDraft().delayMix" (input)="updateDraftNumber('delayMix', $event)" class="range-input accent-indigo">
            </div>

            <div class="form-group">
              <div class="label-row">
                <label class="form-label">Chorus Mix</label>
                <span class="value-display accent-indigo">{{ (designerDraft().chorusMix * 100) | number:'1.0-0' }}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" [value]="designerDraft().chorusMix" (input)="updateDraftNumber('chorusMix', $event)" class="range-input accent-indigo">
            </div>

            <div class="form-row-half">
              <div class="form-group">
                <div class="label-row">
                  <label class="form-label small">LFO Rate</label>
                  <span class="value-display accent-indigo">{{ designerDraft().lfoRate }} Hz</span>
                </div>
                <input type="range" min="0.1" max="20" step="0.1" [value]="designerDraft().lfoRate" (input)="updateDraftNumber('lfoRate', $event)" class="range-input accent-indigo">
              </div>
              <div class="form-group">
                <div class="label-row">
                  <label class="form-label small">LFO Depth</label>
                  <span class="value-display accent-indigo">{{ designerDraft().lfoDepth }}</span>
                </div>
                <input type="range" min="0" max="200" step="1" [value]="designerDraft().lfoDepth" (input)="updateDraftNumber('lfoDepth', $event)" class="range-input accent-indigo">
              </div>
            </div>
          </div>

          <div class="color-picker-section">
            <label class="form-label">Track Color</label>
            <div class="color-palette">
              @for (color of presetColors; track color) {
                <button (click)="updateDraftValue('colorClass', color)" class="color-dot"
                  [class]="color" [class.active]="designerDraft().colorClass === color">
                </button>
              }
            </div>
          </div>
        </div>

        <div class="designer-footer">
          <button (click)="preview.emit(designerDraft())" class="btn-secondary">Preview Sound</button>
          <div class="spacer"></div>
          <button (click)="close.emit()" class="btn-link">Cancel</button>
          <button (click)="save.emit(designerDraft())" class="btn-primary">Save</button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './sound-designer.component.scss'
})
export class SoundDesignerComponent implements OnChanges {
  @Input({ required: true }) preset!: SynthPreset;
  @Input({ required: true }) title!: string;
  @Input() isEditingTimelineNote = false;
  @Input() isEditingPreset = false;
  @Input() presetColors: string[] = [];

  @Output() save = new EventEmitter<SynthPreset>();
  @Output() close = new EventEmitter<void>();
  @Output() preview = new EventEmitter<SynthPreset>();

  designerDraft = signal<SynthPreset>(this.preset);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['preset'] && changes['preset'].currentValue) {
      this.designerDraft.set(changes['preset'].currentValue);
    }
  }

  updateDraft(key: keyof SynthPreset, event: Event) {
    this.updateDraftValue(key, (event.target as HTMLInputElement).value);
  }

  updateDraftNumber(key: keyof SynthPreset, event: Event) {
    this.updateDraftValue(key, Number((event.target as HTMLInputElement).value));
  }

  updateDraftValue(key: keyof SynthPreset, value: any) {
    this.designerDraft.update(draft => ({ ...draft, [key]: value }));
  }
}