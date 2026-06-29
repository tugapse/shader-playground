import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { SynthPreset } from '@editor/models/synth.types';

@Component({
  selector: 'app-preset-list',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preset-list-container">
      <div class="preset-list-header">
        <h2 class="preset-list-title">Presets</h2>
        <button (click)="add.emit()" class="btn-add">+ Add</button>
      </div>
      
      @for (preset of presets(); track preset.id) {
        <div 
          draggable="true"
          (dragstart)="dragStart.emit({ event: $event, preset: preset })"
          (click)="preview.emit(preset)"
          class="preset-item">
          
          <div class="preset-info">
            <div class="preset-color-dot" [class]="preset.colorClass"></div>
            <div>
              <div class="preset-name">{{ preset.name }}</div>
              <div class="preset-meta">{{ preset.waveform }} | {{ preset.frequency }}Hz</div>
            </div>
          </div>

          <div class="preset-actions">
            <button (click)="edit.emit(preset); $event.stopPropagation()" class="btn-action" title="Edit">
              <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
            <button (click)="preview.emit(preset); $event.stopPropagation()" class="btn-action" title="Preview">
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './preset-list.component.scss'
})
export class PresetListComponent {
  presets = input.required<SynthPreset[]>();

  add = output<void>();
  edit = output<SynthPreset>();
  preview = output<SynthPreset>();
  dragStart = output<{ event: DragEvent, preset: SynthPreset }>();
}