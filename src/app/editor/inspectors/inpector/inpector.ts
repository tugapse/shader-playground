import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { GlEntity } from '@engine/entities/entity';

@Component({
  selector: 'editor-inpector',
  imports: [CommonModule],
  templateUrl: './inpector.html',
  styleUrl: './inpector.scss'
})
export class Inpector {

  @Input() targetEntity!: GlEntity

}
