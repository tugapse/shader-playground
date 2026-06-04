import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProjectResponse } from '../../api/models/omega-api.models';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './project-details.html',
  styleUrls: ['./project-details.scss']
})
export class ProjectDetails implements OnChanges {
  @Input({ required: true }) project!: ProjectResponse;
  @Output() save = new EventEmitter<ProjectResponse>();

  editableProject!: ProjectResponse;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['project']) {
      // Create a copy for editing to avoid mutating the original object directly
      this.editableProject = { ...this.project };
    }
  }

  onSave(): void {
    this.save.emit(this.editableProject);
  }
}
