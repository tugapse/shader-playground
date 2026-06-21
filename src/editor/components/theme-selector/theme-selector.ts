import { Component, DOCUMENT, Inject } from '@angular/core';
import {
  DropdownComponent,
  DropdownItem,
} from 'src/app/components/dropdown/dropdown';

@Component({
  selector: 'editor-theme-selector',
  imports: [DropdownComponent],
  templateUrl: './theme-selector.html',
  styleUrl: './theme-selector.scss',
})
export class ThemeSelector {
  protected items: DropdownItem[] = [];
  protected selectedItem!: DropdownItem;
  protected data = [
    {
      code: '',
      title: 'Default',
      descri:    'The default theme.',
    },
    {
      code: 'theme-dark-classic',
      title: 'Classic Dark',
      descri:
        'A professional, high-contrast dark theme inspired by standard IDE environments.',
    },
    {
      code: 'theme-arctic-night',
      title: 'Arctic Night',
      descri:
        'A cool, easy-on-the-eyes dark theme with frosty blue accents, inspired by the Nord palette.',
    },
    {
      code: 'theme-twilight-coral',
      title: 'Twilight Coral',
      descri:
        'A warm, modern twilight aesthetic featuring deep purples and a striking coral accent.',
    },
    {
      code: 'theme-autumn-rust',
      title: 'Autumn Rust',
      descri:
        'An earthy, inviting palette with rich coffee browns and terracotta orange highlights.',
    },
    {
      code: 'theme-cyber-pulse',
      title: 'Cyber Pulse',
      descri:
        'A high-energy cyberpunk theme with deep black-purples, neon pink, and electric cyan.',
    },
  ];

  setTheme(newThemeClass: string) {
    this.document.body.className = newThemeClass;
  }

  onItemSetected($event: DropdownItem) {
    this.setTheme($event.value.toString());
    this.selectedItem = $event;
    localStorage.setItem("omg_theme",this.selectedItem.value.toString())
  }

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.items = this.data.map((a) => ({ key: a.title, value: a.code }));
    this.selectedItem = this.items.find(i=>i.value == localStorage.getItem("omg_theme") || "")!
    this.setTheme(this.selectedItem.value.toString())
  }
}
