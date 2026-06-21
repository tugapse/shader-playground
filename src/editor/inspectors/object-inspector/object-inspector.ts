import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { InpectorTogglePanel } from '@editor/components/inpector-toggle-panel/inpector-toggle-panel';
import { EditorService } from '@editor/services/editor.service';
import { SceneTreeService } from '@editor/services/scene-tree.service';
import {
  Color,
  ColorMaterial,
  EntityBehaviour,
  FogType,
  GlEntity,
  LitMaterial,
  NumberRange,
  Shader,
  Texture,
  Transform,
  UnlitMaterial,
  Vector2,
  Vector3,
  Vector4,
} from '@engine';
import { DropdownItem } from 'src/app/components/dropdown/dropdown';
import { BooleanInspector } from '../../components/inspector/boolean-inspector/boolean-inspector';
import { TextInputInspector } from '../../components/inspector/text-input-inspector/text-input-inspector';
import { VectorInspector } from '../../components/inspector/vector-inspector/vector-inspector';
import { ColorInspector } from '../color-inspector/color-inspector';
import { EnumInspector } from '../enum-inspector/enum-inspector';
import { NumberRangeInspector } from '../number-range-inspector/number-range-inspector';

export interface ITargetObject {
  [key: string]: any;
  key: string;
  type: string;
  property?: any;
  name?: string;
}

export interface ITargetProperty extends ITargetObject {
  value: any;
}

@Component({
  selector: 'editor-object-inspector',
  imports: [
    InpectorTogglePanel,
    TextInputInspector,
    ColorInspector,
    VectorInspector,
    BooleanInspector,
    EnumInspector,
    NumberRangeInspector
],
  templateUrl: './object-inspector.html',
  styleUrl: './object-inspector.scss',
})
export class ObjectInspector {
  // Injected services
  protected sceneTreeService = inject(SceneTreeService);
  protected editorService = inject(EditorService);

  // Inputs
  @Input() allowProperties: string[] = [];
  @Input() denyProperties: string[] = ['meshData', 'gl', 'mesh'];
  @Input() validTypes: string[] = [
    'string',
    'boolean',
    'number',
    'shader',
    'material',
    'color',
    'mesh',
    'vetor234',
    'range',
  ];
  @Input() label: string = 'No title';
  @Input() isChild = false;
  @Input() showPrivateProperties = false;
  @Input() showAllProperties = false;

  @Input() set targetObject(value: ITargetObject) {
    
    this._selectedObject = value;
    this.loadProperties();
    
  }

  // Outputs
  @Output() change = new EventEmitter<any>();

  // Component state
  protected _selectedObject?: ITargetObject;
  protected _properties: ITargetProperty[] = [];
  protected _enums: { [key: string]: any } = {};

  constructor() {
    this._enums['fogType'] = this.convertEnumToObject(FogType);
  }

  // Event Handlers from template
  onValueChanged(
    property: ITargetObject,
    value: string | number | boolean | NumberRange,
  ): void {
    this._onPropertyChanged(property.key, value);
  }

  onVectorChanged(
    property: ITargetObject,
    value: Vector4 | Vector3 | Vector2,
  ): void {
    this._onPropertyChanged(property.key, value);
  }

  onColorChanged(property: ITargetObject, value: Color): void {
    this._onPropertyChanged(property.key, value);
  }

  // Protected methods for template
  protected isNotPrivate(key: string): boolean {
    if (this.showPrivateProperties) return true;
    return !key.startsWith('_');
  }

  protected isValidPropertyType(key: string): boolean {
    if (!this._selectedObject) return false;
    const value =
      this._selectedObject.property?.[key] || this._selectedObject[key];
    const obType = this.getObjectType(value);
    return this.showAllProperties
      ? true
      : this.isNotPrivate(key) && this.validTypes.includes(obType);
  }

  protected convertEnumToObject(
    something: any,
  ): { key: string; value: number }[] {
    return Object.keys(something)
      .filter((k) => Number.isNaN(+k))
      .map((e: string) => {
        return { key: e, value: (something as any)[e] as number };
      });
  }

  // Private and protected helpers
  private _onPropertyChanged(propertyKey: string, value: any): void {
    if (!this._selectedObject?.property || value instanceof Event) return;

    this._selectedObject.property[propertyKey] = value;
    this.change.emit(this._selectedObject.property);
    this.loadProperties();
  }

  protected loadProperties(): void {
    if (!this._selectedObject?.property) {
      this._properties = [];
      return;
    }

    const object = this._selectedObject.property;
    this._properties = Object.keys(object)
      .filter((key) => this.isPropertyValid(key))
      .map((key) => this._createPropertyViewModel(key, object[key]))
      .filter((p): p is ITargetProperty => !!p);
  }


  private _createPropertyViewModel(
    key: string,
    value: any,
  ): ITargetProperty | null {
    if (value === undefined || value === null) {
      return null;
    }

    let type: string = typeof value;
    let name = '';

    if (!!this._enums[key]){
      type = "enum"
    }
    else if (type === 'object') {
      type = this.getObjectType(value);
      name = (value as any).name || '';
    }

    return { key, type, value, name };
  }

  protected getObjectType(value: object): string {
    const className = (value as any)?.className;

    if (className) {
      switch (className) {
        case 'Color':
          return 'color';
        case 'GLEntity':
          return 'entity';
      }
    }

    if (value instanceof Transform) return 'transform';
    if (value instanceof GlEntity) return 'entity';
    if (value instanceof EntityBehaviour) return 'entitybehaviour';
    if (value instanceof Shader) return 'shader';
    if (value instanceof Texture) return 'texture';
    if (value instanceof NumberRange) return 'range';
    if (
      value instanceof ColorMaterial ||
      value instanceof LitMaterial ||
      value instanceof UnlitMaterial
    ) {
      return 'material';
    }
    if (
      value instanceof Vector2 ||
      value instanceof Vector3 ||
      value instanceof Vector4 ||
      value instanceof Float32Array
    ) {
      return 'vector234';
    }

    return typeof value;
  }

  protected isPropertyValid(key: string): boolean {
    const isPublic = !key.startsWith('_');
    if (!isPublic) {
      return false;
    }

    if (this.allowProperties.length > 0) {
      return this.allowProperties.includes(key);
    }

    if (this.denyProperties.length > 0) {
      return !this.denyProperties.includes(key);
    }

    return true;
  }

  /**
   * This method is used to update the scene after a property has been changed. It emits the onSceneUpdated event from the SceneTreeService to notify all subscribers that the scene has been updated and they should refresh their data if needed.
   */
  protected updateScene(): void {
    const scene = this.editorService.scene;
    this.editorService.onSceneUpdated.emit(scene);
  }

  onEnumChange(key: string, menuItem: DropdownItem) {
    
    this._selectedObject!.property[key] = menuItem.value;
    this.editorService.requestCanvasResize();
  }
}
