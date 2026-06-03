import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule for ngIf / ngFor
import { BackgroundVisualizationComponent } from '../background-visualization/background-visualization.component';

interface Project {
  name: string;
  description: string;
  updated_at: Date;
}

@Component({
  selector: 'app-home',
  standalone: true, // Mark it explicitly if it's standalone
  imports: [CommonModule, BackgroundVisualizationComponent], // Injects structural directives into the template template scope
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'] // Adjust extension to .scss if necessary
})
export class HomeComponent implements OnInit {
  selectedProject: Project | null = null;
  
  projects: Project[] = [
    { 
      name: 'Project_Sentinel_Rpg', 
      description: 'An open-world isometric tactical game using a custom behavioral tree logic engine.', 
      updated_at: new Date('2026-05-24') 
    },
    { 
      name: 'Cyber_Sandbox_3D', 
      description: 'A physically-based rendering sandbox featuring custom rigid body dynamics and lit shaders.', 
      updated_at: new Date('2026-05-19') 
    },
    { 
      name: 'Retro_Platformer_Demo', 
      description: 'A pixel-perfect retro framework showcasing fast tilemap rendering and localized collision matrices.', 
      updated_at: new Date('2026-04-12') 
    }
  ];

  constructor() {}

  ngOnInit(): void {}

  selectProject(project: Project): void {
    this.selectedProject = project;
  }
}