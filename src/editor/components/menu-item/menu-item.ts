import { Component, input, output, signal } from '@angular/core';
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
  styleUrls: ['./menu-item.scss'],
})
export class MenuItemComponent {
  item = input.required<MenuItem>();
  isRoot = input<boolean>(false);
  onItemClick = output<MenuItem>();

  isOpen = signal<boolean>(false);
  private leaveTimeout: any = null;
  private readonly _debounceTime = 250;

  onMouseEnter() {
    if (this.leaveTimeout) {
      clearTimeout(this.leaveTimeout);
      this.leaveTimeout = null;
    }
    this.isOpen.set(true);
  }

  onMouseLeave() {
    this.leaveTimeout = setTimeout(() => {
      this.isOpen.set(false);
    }, this._debounceTime);
  }

  onItemClickHandler(clickedItem: MenuItem) {
    const currentItem = this.item();

    if (
      currentItem.items &&
      currentItem.items.length > 0 &&
      clickedItem.id === currentItem.id
    ) {
      return;
    }

    this.onItemClick.emit(clickedItem); // Cleanly close menu tree on final selection
  }
}
