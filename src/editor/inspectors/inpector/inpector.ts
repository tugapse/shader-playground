import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { EditorService } from '@editor/editor.service';
import { Color, Transform } from '@engine/core';
import { Vector2, Vector3, Vector4 } from '@engine/core/vector';
import { LightAttenuation, LightConeAngles } from '@engine/entities';
import { GlEntity } from '@engine/entities/entity';
import { ColorInspector } from "../color-inspector/color-inspector";
import { TransformInspector } from "../transform-inspector/transform-inspector";
import { InspectorHeader } from '../components/inspector-header/inspector-header';
import { InpectorTogglePanel } from '../components/inpector-toggle-panel/inpector-toggle-panel';

@Component({
  selector: 'editor-inpector',
  imports: [CommonModule, InspectorHeader, TransformInspector, ColorInspector],
  templateUrl: './inpector.html',
  styleUrl: './inpector.scss'
})
export class Inpector {

  private excludeProperties = ["name", "tag", "active", "show", "destroyed", "behaviours", "updateInEditor", "scene"];
  objectsToshow: { key: string, type: string }[] = []

  private prepareProperties(entity: GlEntity) {
    if (entity) {
      this.objectsToshow = Object.keys(entity)
        .filter(this.isValidProperty.bind(this))
        .map(key => this.mapProperty(entity, key));
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
    setTimeout(() => this.editorService.requestCanvasResize(), 30);
  }

  private mapProperty(entity: GlEntity, key: string) {
    let type = "";
    switch (true) {
      // primitives
      case ((entity as any)[key] instanceof Number):
        type = Number.name;
        break;
      case ((entity as any)[key] instanceof String):
        type = String.name;
        break;
      case ((entity as any)[key] instanceof Boolean):
        type = Boolean.name;
        break;
      // Engine Objects
      case ((entity as any)[key] instanceof Transform):
        type = Transform.name;
        break;
      case ((entity as any)[key] instanceof Vector2):
        type = Vector2.name;
        break;
      case ((entity as any)[key] instanceof Vector3):
        type = Vector3.name;
        break;
      case ((entity as any)[key] instanceof Vector4):
        type = Vector4.name;
        break;

      case ((entity as any)[key] instanceof Color):
        type = Color.name;
        break;
      case ((entity as any)[key] instanceof LightAttenuation):
        type = LightAttenuation.name;
        break;
      case ((entity as any)[key] instanceof LightConeAngles):
        type = LightConeAngles.name;
        break;


      default:
        type = Object.name
        break;
    }
    return { key, type }
  }

  private isValidProperty(key: string) {
    return key.startsWith("_") == false && this.excludeProperties.includes(key) == false
  }
}
