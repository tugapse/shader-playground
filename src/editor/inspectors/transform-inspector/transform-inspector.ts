import { CommonModule } from "@angular/common";
import { Component, inject, Input } from "@angular/core";
import {
  DragEventData,
  DragHandleDirective,
} from "@editor/directives/mouse-drag.directive";
import { InpectorTogglePanel } from "../../components/inpector-toggle-panel/inpector-toggle-panel";
import { SceneEntity, Transform } from "omega-game-engine";
import { EngineLogger } from "src/engine/logger";
import { Icon } from "src/app/components/icon/icon";
import { ConfirmationService } from "src/app/services/confirmation.service";

@Component({
  selector: "editor-transform-inspector",
  imports: [CommonModule, InpectorTogglePanel, DragHandleDirective, Icon],
  templateUrl: "./transform-inspector.html",
  styleUrl: "./transform-inspector.scss",
})
export class TransformInspector {
  scaleX = 1;
  scaleY = 1;
  scaleZ = 1;

  private valueScale = 0.1;
  private confirmService = inject(ConfirmationService);

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
        this.transform.setLocalScale(this.scaleX, this.scaleY, this.scaleZ);
        break;
    }
    this.transform.updateMatrices();
  }

  transform!: Transform;

  @Input() set entity(value: SceneEntity) {
    this.transform = value.transform;
    this.transform.setDirty(true);
    this.transform.updateMatrices();
    this.scaleX = this.transform.localScale[0];
    this.scaleY = this.transform.localScale[1];
    this.scaleZ = this.transform.localScale[2];
  }
  @Input() collapsed = false;

  onPositionChanged(index: number, event: Event) {
    const value = this.transform.localPosition;
    value[index] = +(event.target as any).value;
    this.transform.worldPosition = value;
    this.transform.setLocalPosition(value[0], value[1], value[2]);
  }

  onRotationChanged(index: number, event: Event) {
    const value = this.transform.localRotation;
    value[index] = +(event.target as any).value;
    this.transform.setLocalRotation(value[0], value[1], value[2]);
  }

  onScaleChanged(index: number, event: Event) {
    const value = this.transform.localScale;
    value[index] = +(event.target as any).value;
    this.transform.setLocalScale(value[0], value[1], value[2]);
  }

  onReset() {
    this.confirmService
      .confirm({
        title: "Reset entity transform ?",
        message: `Are you sure you want to reset entity transform?`,
        confirmText: "Reset",
        cancelText: "Cancel",
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.transform.setLocalPosition(0, 0, 0);
          this.transform.setLocalRotation(0, 0, 0);
          this.transform.setLocalScale(1, 1, 1);
        }
      });
  }
}
