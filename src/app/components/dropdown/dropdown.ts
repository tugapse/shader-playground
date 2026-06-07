import { Component, Input, Output, EventEmitter, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

// Define the interface for the dropdown items
export interface DropdownItem {
  key: string;
  value: string|number;
}

@Component({
  selector: 'app-dropdown',
  templateUrl: "./dropdown.html",
  styleUrl: './dropdown.scss',
  imports: [CommonModule]
})
export class DropdownComponent implements OnInit, OnDestroy {
  @Input() selectedItem: DropdownItem | null = null;
  @Input() items: DropdownItem[] = [];
  @Output() itemSelected = new EventEmitter<DropdownItem>();

  public isOpen: boolean = false;

  private mouseListener: (() => void) | null = null;

  constructor() { }

  ngOnInit(): void {
    this.mouseListener = () => {
      if (this.isOpen) {
        this.isOpen = false;
      }
    };
    document.addEventListener('mouseup', this.mouseListener);
  }

  ngOnDestroy(): void {
    if (this.mouseListener) {
      document.removeEventListener('mouseup', this.mouseListener);
    }
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  selectItem(item: DropdownItem): void {
    
    this.selectedItem = item;
    this.itemSelected.emit(item);
    this.isOpen = false;
  }
}
