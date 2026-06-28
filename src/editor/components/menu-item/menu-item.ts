import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MenuItem {
  id: string;
  label: string;
  items?: MenuItem[];
}

@Component({
  selector: 'app-menu-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-item.html',
  styleUrls: ['./menu-item.scss']
})
export class MenuItemComponent {
  @Input({ required: true }) item!: MenuItem;
  @Input() isRoot: boolean = false;
  
  @Output() onItemClick = new EventEmitter<MenuItem>();

  isOpen: boolean = false;

  onMouseEnter() {
    this.isOpen = true;
  }

  onMouseLeave() {
    this.isOpen = false;
  }

  onItemClickHandler(clickedItem: MenuItem) {
    debugger
    if (this.item.items && this.item.items.length > 0 && clickedItem.id === this.item.id) {
       return; 
    }

    this.onItemClick.emit(clickedItem);
  }
}