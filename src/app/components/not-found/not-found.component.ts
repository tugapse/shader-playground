import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackgroundVisualizationComponent } from "../background-visualization/background-visualization.component";

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, BackgroundVisualizationComponent],
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
})
export class NotFoundComponent {
  constructor() {}
}