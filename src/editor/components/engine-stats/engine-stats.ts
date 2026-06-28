import {
  Component,
  Input,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovableDirective } from '@editor/directives/moveable.directive';
import { Icon } from 'src/app/components/icon/icon';

export interface EngineStats {
  fps: number;
  frameTimeMs: number;
  updateTimeMs: number;
  renderTimeMs: number;
  browserTimeMs: number;
}

@Component({
  selector: 'editor-engine-stats',
  imports: [CommonModule, MovableDirective, Icon],
  templateUrl: './engine-stats.html',
  styleUrl: './engine-stats.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngineStatsComponent {
  @Input() stats: EngineStats | null = null;
  @Output() closeRequested = new EventEmitter<void>();
}
