import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface EngineStats {
  fps: number;
  frameTimeMs: number;
  updateTimeMs: number;
  renderTimeMs: number;
}

@Component({
  selector: 'editor-engine-stats',
  imports: [CommonModule],
  templateUrl: './engine-stats.html',
  styleUrl: './engine-stats.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EngineStatsComponent {
  @Input() stats: EngineStats | null = null;
}