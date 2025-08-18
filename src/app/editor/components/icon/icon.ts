import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon',
  imports: [],
  templateUrl: './icon.html',
  styleUrl: './icon.scss'
})
export class Icon {
  @Input() iconName: string = "fa-file-invoice-dollar"
  @Input() iconSize: number = 12;
}
