import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { InpectorTogglePanel } from "@editor/components/inpector-toggle-panel/inpector-toggle-panel";
import { MovableDirective } from '@editor/directives/moveable.directive';
import { EditorService } from '@editor/editor.service';
import { Color, Transform } from '@engine/core';
import { Vector2, Vector3, Vector4 } from '@engine/core/vector';
import { GlEntity } from '@engine/entities/entity';
import { ColorInspector } from "../color-inspector/color-inspector";
import { InspectorHeader } from '../../components/inspector/inspector-header/inspector-header';
import { VectorInspector } from "../../components/inspector/vector-inspector/vector-inspector";
import { ObjectInspector } from "../object-inspector/object-inspector";
import { TransformInspector } from "../transform-inspector/transform-inspector";
import { Icon } from "src/app/components/icon/icon";

@Component({
  selector: 'editor-inpector',
  templateUrl: './inpector.html',
  styleUrl: './inpector.scss',
  imports: [
    CommonModule, InspectorHeader, TransformInspector, ColorInspector,
    VectorInspector, InpectorTogglePanel, ObjectInspector, MovableDirective,
    Icon
],
})
export class Inpector {

  onVectorChanged(_t10: { key: string; type: string; property: any; }, $event: Vector4 | Vector3 | Vector2) {
  }

  @Input() excludeProperties = ["name", "tag", "active", "show", "destroyed", "entityType", "behaviours", "updateInEditor", "scene"];
  objectsToshow: { key: string, type: string, property: any }[] = []

  private prepareProperties(entity: GlEntity) {
    if (entity) {
      this.objectsToshow = Object.keys(entity)
        .filter(this.isValidProperty.bind(this))
        .map(key => this.mapProperty(entity, key));
      debugger
      console.debug("Inspector Primitives", this.objectsToshow);
    }
  }

  @Input() set targetEntity(entity: GlEntity) {
    this.prepareProperties(entity);
    this.entity = entity;
  };

  entity!: GlEntity | null;

  constructor(private editorService: EditorService) { }

  onNameChanged($event: any): void {
    this.entity!.name = $event.target.value;
  }

  onTagChanged($event: any): void {
    this.entity!.name = $event.target.value;
  }

  onClose() {
    this.entity = null;
    debugger
    this.editorService.onEditorSaveStateRequest.emit(true);
    this.editorService.requestCanvasResize();
  }

  private mapProperty(entity: GlEntity, key: string) {
    let type = "";
    switch (true) {
      // Engine Objects
      case ((entity as any)[key] instanceof Transform):
        type = Transform.name;
        break;
      case ((entity as any)[key] instanceof Vector2):
      case ((entity as any)[key] instanceof Vector3):
      case ((entity as any)[key] instanceof Vector4):
        type = "_Vector234";
        break;

      case ((entity as any)[key] instanceof Color):
        type = Color.name;
        break;


      default:
        type = Object.name
        break;
    }
    const property = (entity as any)[key]
    return { key, type, property }
  }

  private isValidProperty(key: string) {
    return key.startsWith("_") == false && this.excludeProperties.includes(key) == false
  }
}
