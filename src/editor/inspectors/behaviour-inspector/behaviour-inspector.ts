import { Component, Input } from '@angular/core';
import { InpectorTogglePanel } from '@editor/components/inpector-toggle-panel/inpector-toggle-panel';
import { BooleanInspector } from '@editor/components/inspector-components/boolean-inspector/boolean-inspector';
import { TextInputInspector } from '@editor/components/inspector-components/text-input-inspector/text-input-inspector';
import {
  Color,
  CullFace,
  DephFunction,
  EntityBehaviour,
  FaceWinding,
  NumberRange,
  RenderLayer,
} from '@engine';
import { DropdownItem } from 'src/app/components/dropdown/dropdown';
import { Icon } from 'src/app/components/icon/icon';
import { ConfirmationService } from 'src/app/services/confirmation.service';
import { DefaultInspector } from '../default-inspector/default-inspector';
import { EnumInspector } from '../enum-inspector/enum-inspector';
import {
  ITargetObject,
  ITargetProperty,
  ObjectInspector,
} from '../object-inspector/object-inspector';
import { ShaderInspector } from '../shader-inspector/shader-inspector';

@Component({
  selector: 'editor-behaviour-inspector',
  imports: [
    ObjectInspector,
    InpectorTogglePanel,
    TextInputInspector,
    BooleanInspector,
    EnumInspector,
    Icon,
    ShaderInspector,
    DefaultInspector,
  ],
  templateUrl: './behaviour-inspector.html',
  styleUrl: './behaviour-inspector.scss',
})
export class BehaviourInspector extends ObjectInspector {
  _renderProperties: ITargetProperty[] = [];
  _renderEnable: ITargetProperty[] = [];

  constructor(private confirmationService: ConfirmationService) {
    super();
  }

  // prepare enums related to rendering
  protected drawingEnums: { [key: string]: { key: string; value: number }[] } =
    {
      renderLayer: Object.keys(RenderLayer)
        .filter((k) => Number.isNaN(+k))
        .map((e: string) => {
          return { key: e, value: (RenderLayer as any)[e] as number };
        }),

      cullFace: Object.keys(CullFace)
        .filter((k) => Number.isNaN(+k))
        .map((e: string) => {
          return { key: e, value: (CullFace as any)[e] };
        }),

      dephMode: Object.keys(DephFunction)
        .filter((k) => Number.isNaN(+k))
        .map((e: string) => {
          return { key: e, value: (DephFunction as any)[e] };
        }),

      faceWinding: Object.keys(FaceWinding)
        .filter((k) => Number.isNaN(+k))
        .map((e: string) => {
          return { key: e, value: (FaceWinding as any)[e] };
        }),
    };
  protected renderBooleans = [
    'enableCullFace',
    'enableDephTest',
    'enableBlend',
    'writeToDephBuffer',
  ];

  override denyProperties: string[] = [
    'active',
    'parent',
    'enableLights',
    'mesh',
    'time',
    'drawPrimitiveType',
    ...Object.keys(this.drawingEnums),
    'blendMode', // inner emuns
    ...this.renderBooleans,
  ];

  @Input() set behaviour(value: EntityBehaviour) {
    this._selectedObject = {
      key: value.className,
      type: value.className,
      property: value,
    };
    this.loadProperties();
  }

  get behaviour() {
    return this._selectedObject?.property;
  }

  protected override loadProperties(): void {
    super.loadProperties();
    this._renderProperties = [];
    this._renderEnable = [];

    for (const enumName of Object.keys(this.drawingEnums)) {
      const value = this._selectedObject?.property[enumName];
      const arrayValues: DropdownItem[] = [];
      for (const enumObj of this.drawingEnums[enumName]) {
        arrayValues.push(enumObj);
      }
      if (value != undefined) {
        const p: ITargetProperty = {
          key: enumName,
          type: 'enum',
          property: arrayValues,
          value: arrayValues.find((e) => e.value == value),
        };

        this._renderProperties.push(p);
      }
    }

    for (const boolName of this.renderBooleans) {
      const value = this._selectedObject?.property[boolName];

      if (value != undefined) {
        const p: ITargetProperty = {
          key: boolName,
          type: 'boolean',
          property: this._selectedObject?.property[boolName],
          value: value,
        };

        this._renderEnable.push(p);
      }
    }
  }

  onEnumChanged(item: ITargetProperty, $event: DropdownItem) {
    this._selectedObject!.property[item.key] = $event.value;
  }

  onDefaultChanged(
    item: ITargetProperty,
    value: string | number | boolean | NumberRange | Color,
  ) {
    this.behaviour[item.key] = value
  }

  onRemoveBehaviourRequested() {
    this.confirmationService
      .confirm({
        title: 'Remove Behaviour',
        message: `Are you sure you want to remove the ${this.behaviour.className} behaviour?`,
        confirmText: 'Remove',
        cancelText: 'Cancel',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.behaviour.parent.removeBehaviour(this.behaviour);
        }
      });
  }
}
