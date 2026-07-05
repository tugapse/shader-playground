import {
  Component,
  EventEmitter,
  Input,
  Output,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassMetadata } from 'omega-game-engine';
import { SearchableMenuComponent } from '../searchable-menu/searchable-menu';

@Component({
  selector: 'editor-add-behaviour-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './add-scene-entity-menu.html',
  styleUrls: ['./add-scene-entity-menu.scss'],
})
export class AddBehaviourMenuComponent extends SearchableMenuComponent {
  @Input() behaviours: ClassMetadata[] = [];

  @Output() behaviourSelected = new EventEmitter<ClassMetadata>();

  get filteredBehaviours(): ClassMetadata[] {
    if (!this.searchQuery) return this.behaviours;
    const lowerQuery = this.searchQuery.toLowerCase();
    return this.behaviours.filter(
      (b) =>
        b.name.toLowerCase().includes(lowerQuery) ||
        (b.description! || '').toLowerCase().includes(lowerQuery) ||
        b.type.toLowerCase().includes(lowerQuery),
    );
  }
}
