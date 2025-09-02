import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DragEventData, DragHandleDirective } from "@editor/directives/mouse-drag.directive";
import { InpectorTogglePanel } from "../../components/inpector-toggle-panel/inpector-toggle-panel";
import { GlEntity, Transform } from 'omega-game-engine';

@Component({
  selector: 'editor-transform-inspector',
  imports: [CommonModule, InpectorTogglePanel, DragHandleDirective],
  templateUrl: './transform-inspector.html',
  styleUrl: './transform-inspector.scss'
})
export class TransformInspector {
  scaleX = 1;
  scaleY = 1;
  scaleZ = 1;

  private valueScale = 0.1;
  onSpanDrag(side: number, index: number, $event: DragEventData) {
    const amount = $event.deltaX * this.valueScale;
    switch (side) {
      case 0:
        this.performAction(index, amount, 0, 0);
        break;
      case 1:
        this.performAction(index, 0, amount, 0);
        break;
      case 2:
        this.performAction(index, 0, 0, amount);
        break;
    }
  }

  performAction(index: number, x: number, y: number, z: number) {
    switch (index) {
      case 0:
        this.transform.translate(x, y, z);
        break;
      case 1:
        this.transform.rotate(x, y, z);
        break;
      case 2:
        this.scaleX += x;
        this.scaleY += y;
        this.scaleZ += z;
        this.transform.setScale(this.scaleX, this.scaleY, this.scaleZ);
        break;
    }
    this.transform.updateMatrices();
  }

  transform!: Transform;

  @Input() set entity(value: GlEntity) {
    this.transform = value.transform;
    this.scaleX = this.transform.localScale[0];
    this.scaleY = this.transform.localScale[1];
    this.scaleZ = this.transform.localScale[2];
  }

  onPositionChanged(index: number, event: Event) {
    const value = this.transform.position;
    value[index] = (event.target as any).value;
    this.transform.setPosition(...value);
  }

  onRotationChanged(index: number, event: Event) {
    const value = this.transform.rotation;
    value[index] = (event.target as any).value;
    this.transform.setRotation(...value);
  }

  onScaleChanged(index: number, event: Event) {
    const value = this.transform.localScale;
    value[index] = (event.target as any).value;
    this.transform.setScale(...value);
  }
}
