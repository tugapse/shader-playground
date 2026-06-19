import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';

export interface MenuItem {
  id: string;
  type: string;
  path: string;
  name: string;
  description: string;
}

@Component({
  selector: 'editor-searchable-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './searchable-menu.html',
  styleUrls: ['./searchable-menu.scss'],
})
export class SearchableMenuComponent {
  @Input() items: MenuItem[] = [];
  @Input() isOpen = false;
  @Input() menuX = 0;
  @Input() menuY = 0;

  @Output() itemSelected = new EventEmitter<MenuItem>();
  @Output() closeMenu = new EventEmitter<void>();

  protected searchQuery = '';

  constructor(private elementRef: ElementRef) {}

  public get filteredItems(): MenuItem[] {
    if (!this.searchQuery) return this.items;
    const lowerQuery = this.searchQuery.toLowerCase();
    return this.items.filter(
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

  selectItem(item: MenuItem, event: MouseEvent): void {
    event.stopPropagation();
    this.itemSelected.emit(item);
    this.closeMenu.emit();
    this.searchQuery = '';
  }
}
