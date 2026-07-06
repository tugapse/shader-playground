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

@Component({
  selector: 'editor-add-behaviour-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './add-behaviour-menu.html',
  styleUrls: ['./add-behaviour-menu.scss'],
})
export class AddBehaviourMenuComponent {
  @Input() behaviours: ClassMetadata[] = [];
  @Input() isOpen = false;
  @Input() menuX = 0;
  @Input() menuY = 0;

  @Output() behaviourSelected = new EventEmitter<ClassMetadata>();
  @Output() closeMenu = new EventEmitter<void>();

  searchQuery = '';

  constructor(private elementRef: ElementRef) {}

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

  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen) return;

    // Check if click was inside the component
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.closeMenu.emit();
    }
  }

  selectBehaviour(behaviour: ClassMetadata, event: MouseEvent): void {
    event.stopPropagation();
    this.behaviourSelected.emit(behaviour);
    this.closeMenu.emit();
    this.searchQuery = '';
  }
}
