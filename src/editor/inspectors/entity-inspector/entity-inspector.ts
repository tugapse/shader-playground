import { Component, Input } from '@angular/core';
import { EditorService } from '@editor/editor.service';
import { GlEntity } from '@engine/entities/entity';
import { ITargetObject, ObjectInspector } from '../object-inspector/object-inspector';
import { EntityBehaviour } from '@engine/behaviours/entity-behaviour';
import { Transform } from '@engine/core/transform';
import { Color } from '@engine/core';
import { Vector2, Vector3, Vector4 } from '@engine/core/vector';
import { InpectorTogglePanel } from "@editor/components/inpector-toggle-panel/inpector-toggle-panel";
import { TransformInspector } from "../transform-inspector/transform-inspector";
import { TextInputInspector } from "@editor/components/inspector/text-input-inspector/text-input-inspector";
import { BooleanInspector } from "@editor/components/inspector/boolean-inspector/boolean-inspector";
import { ColorInspector } from "../color-inspector/color-inspector";
import { VectorInspector } from "@editor/components/inspector/vector-inspector/vector-inspector";
import { BehaviourInspector } from "../behaviour-inspector/behaviour-inspector";
import { Toggle } from "src/app/components/toggle/toggle";

@Component({
  selector: 'editor-entity-inspector',
  imports: [InpectorTogglePanel, TransformInspector, TextInputInspector, BooleanInspector, ColorInspector, VectorInspector, ObjectInspector, BehaviourInspector, Toggle],
  templateUrl: './entity-inspector.html',
  styleUrl: './entity-inspector.scss'
})
export class EntityInspector extends ObjectInspector {

  @Input() excludeProperties = ["name", "active", "updateInEditor", "entityType", "show", "tag", "destroyed", "behaviours", "scene"];
  objectsToshow: ITargetObject[] = []

  private prepareProperties(entity: GlEntity) {
    if (entity) {
      this.objectsToshow = Object.keys(entity)
        .filter(this.isPropertyValid.bind(this))
        .map(key => this.mapProperty(entity, key));

    }
  }

  @Input() set targetEntity(entity: GlEntity) {
    this.prepareProperties(entity);
    this.entity = entity;
  };

  entity?: GlEntity | null;

  constructor(private editorService: EditorService) {
    super();
  }

  onNameChanged($event: any): void {
    if (!this.entity) return;
    this.entity.name = $event.target.value;
  }

  onTagChanged($event: any): void {
    if (!this.entity) return;
    this.entity.name = $event.target.value;
  }

  override onValueChanged(entityProperty: any, value: string | number | boolean): void {
    if (!this.entity) return;
    this.entity[entityProperty.key] = value;
    entityProperty.property[entityProperty.key] = value;
  }

  override onColorChanged(entityProperty: ITargetObject, value: Color): void {
    if (!this.entity) return;
    this.entity[entityProperty.key] = value;
    // entityProperty.property[entityProperty.key] = value;
  }

  private mapProperty(entity: GlEntity, key: string) {
    let type = "";
    const propertyType = typeof entity[key]
    switch (true) {

      // Engine Objects
      case (entity[key] instanceof Transform):
        type = Transform.name;
        break;
      case (entity[key] instanceof Vector2):
      case (entity[key] instanceof Vector3):
      case (entity[key] instanceof Vector4):
        type = "_Vector234";
        break;
      case (entity[key] instanceof Color):
        type = Color.name;
        break;

      case (propertyType == 'boolean' || propertyType == 'string' || propertyType == 'number'):
        type = propertyType;
        break;

      default:
        type = Object.name
        break;
    }
    const property = entity[key]
    return { key, type, property }
  }

  protected override isPropertyValid(key: string): boolean {
    return (this.isNotPrivate(key) && this.excludeProperties.includes(key) == false);
  }
}
