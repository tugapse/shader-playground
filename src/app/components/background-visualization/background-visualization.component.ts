import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-background-visualization',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './background-visualization.component.html',
  styleUrls: ['./background-visualization.component.scss']
})
export class BackgroundVisualizationComponent {
  @Input() statusText: string = 'SYSTEM STANDBY // AWAITING INPUT...';
  @Input() showStars: boolean = true;
}
