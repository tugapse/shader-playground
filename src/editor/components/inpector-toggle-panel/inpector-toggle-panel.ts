import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Icon } from "src/app/components/icon/icon";

@Component({
  selector: 'editor-inpector-toggle-panel',
  imports: [Icon, CommonModule],
  templateUrl: './inpector-toggle-panel.html',
  styleUrl: './inpector-toggle-panel.scss'
})
export class InpectorTogglePanel {
  @Input() title: string = "NoName";
  @Input() collapsed: boolean = true;
  @Input() isChild: boolean = false;
}
