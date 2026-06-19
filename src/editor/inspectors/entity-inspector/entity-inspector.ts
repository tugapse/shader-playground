import { Component, Input } from '@angular/core';
import { InpectorTogglePanel } from '@editor/components/inpector-toggle-panel/inpector-toggle-panel';
import { BooleanInspector } from '@editor/components/inspector/boolean-inspector/boolean-inspector';
import { TextInputInspector } from '@editor/components/inspector/text-input-inspector/text-input-inspector';
import { VectorInspector } from '@editor/components/inspector/vector-inspector/vector-inspector';

import { Toggle } from 'src/app/components/toggle/toggle';
import { BehaviourInspector } from '../behaviour-inspector/behaviour-inspector';
import { ColorInspector } from '../color-inspector/color-inspector';
import {
  ITargetObject,
  ObjectInspector,
} from '../object-inspector/object-inspector';
import { TransformInspector } from '../transform-inspector/transform-inspector';
import {
  GlEntity,
  Color,
  ObjectInstanciator,
  EntityBehaviour,
  CameraType,
} from '@engine';
import { EditorService } from '@editor/services/editor.service';
import { Icon } from 'src/app/components/icon/icon';
import { ClassType } from '@engine/enums/class-type.enum';
import { AddBehaviourMenuComponent } from '../../components/add-behaviour-menu/add-behaviour-menu';
import { ClassMetadata } from '@engine/interfaces/class-metadata';
import { take } from 'rxjs';
import { EnumInspector } from '../enum-inspector/enum-inspector';
import { DropdownItem } from 'src/app/components/dropdown/dropdown';

@Component({
  selector: 'editor-entity-inspector',
  imports: [
    InpectorTogglePanel,
    TransformInspector,
    TextInputInspector,
    BooleanInspector,
    ColorInspector,
    VectorInspector,
    ObjectInspector,
    BehaviourInspector,
    Toggle,
    Icon,
    AddBehaviourMenuComponent,
    EnumInspector,
  ],
  templateUrl: './entity-inspector.html',
  styleUrl: './entity-inspector.scss',
})
export class EntityInspector extends ObjectInspector {
  @Input() excludeProperties = [
    'name',
    'active',
    'updateInEditor',
    'entityType',
    'show',
    'tag',
    'destroyed',
    'behaviours',
    'scene',
  ];
  objectsToshow: ITargetObject[] = [];

  private prepareProperties(entity: GlEntity) {
    if (entity) {
      this.objectsToshow = Object.keys(entity)
        .filter(this.isPropertyValid.bind(this))
        .map((key) => this.mapProperty(entity, key));
    }
  }

  @Input() set targetEntity(entity: GlEntity) {
    this.prepareProperties(entity);
    this.entity = entity;
  }

  entity?: GlEntity | null;
  isAddBehaviourMenuOpen = false;
  availableBehaviours: ClassMetadata[] = [];
  menuX = 0;
  menuY = 0;

  constructor() {
    super();
    this._enums['cameraType'] = this.convertEnumToObject(CameraType);
  }

  onNameChanged($event: any): void {
    if (!this.entity) return;
    this.entity.name = $event.target.value;
    this.updateScene();
  }

  onTagChanged($event: any): void {
    if (!this.entity) return;
    this.entity.tag = $event.target.value;
  }

  override onValueChanged(
    entityProperty: any,
    value: string | number | boolean,
  ): void {
    if (!this.entity || Number.isNaN(value)) return;
    
    this.editorService.requestCanvasResize();
    this.entity[entityProperty.key] = value;
    entityProperty.property[entityProperty.key] = value;
  }

  override onColorChanged(entityProperty: ITargetObject, value: Color): void {
    if (!this.entity) return;
    this.entity[entityProperty.key] = value;
    // entityProperty.property[entityProperty.key] = value;
  }

  private mapProperty(entity: GlEntity, key: string) {
    const isEnum = !!this._enums[key];
    const type = isEnum ? 'enum' : this.getObjectType(entity[key]);
    const property = entity[key];

    return { key, type, property };
  }

  protected override isPropertyValid(key: string): boolean {
    return (
      this.isNotPrivate(key) && this.excludeProperties.includes(key) == false
    );
  }

  onAddBehaviourRequested(event: MouseEvent) {
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    // Position slightly below and right-aligned with the button
    this.menuY = rect.top - 100;
    this.menuX = 24; // 320px is the menu width

    this.availableBehaviours = ObjectInstanciator.getMetadata([
      ClassType.EntityBehaviour,
      ClassType.RenderBehaviour,
    ]).filter(
      (b) => b.name !== 'EntityBehaviour' && b.name !== 'RenderBehaviour',
    ) as ClassMetadata[];
    this.isAddBehaviourMenuOpen = true;
  }

  onBehaviourSelected(behaviour: ClassMetadata) {
    if (!this.entity) return;
    const instance = ObjectInstanciator.instanciateObjectFromJsonData(
      behaviour.name,
      [this.editorService.gl],
    );
    if (instance) {
      this.entity.addBehaviour(instance as EntityBehaviour);
      this.editorService.onSceneUpdated.emit(this.editorService.scene);
    }
  }

  onEnumChange(key:string, menuItem: DropdownItem) {
    this.entity![key] = menuItem.value;
    this.editorService.requestCanvasResize();
  }
}
