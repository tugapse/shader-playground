import { Component } from '@angular/core';
import { BackgroundVisualizationComponent } from 'src/app/components/background-visualization/background-visualization.component';

@Component({
  selector: 'app-dashboard-welcome',
  imports: [BackgroundVisualizationComponent],
  templateUrl: './dashboard-welcome.html',
  styleUrl: './dashboard-welcome.scss',
})
export class DashboardWelcome {}
