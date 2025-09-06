import { Component, Input } from '@angular/core';
import { InpectorTogglePanel } from "@editor/components/inpector-toggle-panel/inpector-toggle-panel";
import { BooleanInspector } from "@editor/components/inspector/boolean-inspector/boolean-inspector";
import { TextInputInspector } from "@editor/components/inspector/text-input-inspector/text-input-inspector";
import { VectorInspector } from "@editor/components/inspector/vector-inspector/vector-inspector";
import { ColorInspector } from "../color-inspector/color-inspector";
import { ITargetObject, ITargetProperty, ObjectInspector } from '../object-inspector/object-inspector';
import { CullFace, DephFunction, EntityBehaviour, FaceWinding, RenderLayer } from 'omega-game-engine';
import { EnumInspector } from "../enum-inspector/enum-inspector";
import { DropdownItem } from 'src/app/components/dropdown/dropdown';

@Component({
  selector: 'editor-behaviour-inspector',
  imports: [ObjectInspector, InpectorTogglePanel, TextInputInspector, BooleanInspector, ColorInspector, VectorInspector, EnumInspector],
  templateUrl: './behaviour-inspector.html',
  styleUrl: './behaviour-inspector.scss'
})
export class BehaviourInspector extends ObjectInspector {


  // prepare enums related to rendering
  protected drawingEnums: { [key: string]: { key: string, value: number }[] } = {
    'renderLayer': Object.keys(RenderLayer).filter(k => Number.isNaN(+k))
    .map((e: string) => { return { key: e, value: (RenderLayer as any)[(e)] as number } }),

    'cullFace': Object.keys(CullFace).filter(k => Number.isNaN(+k))
    .map((e: string) => { return { key: e, value: (CullFace as any)[e] } }),

    'dephMode': Object.keys(DephFunction).filter(k => Number.isNaN(+k))
    .map((e: string) => { return { key: e, value: (DephFunction as any)[e] } }),

    'faceWinding': Object.keys(FaceWinding).filter(k => Number.isNaN(+k))
    .map((e: string) => { return { key: e, value: (FaceWinding as any)[e] } }),
  }
  protected renderBooleans = ["enableCullFace", "enableDephTest", "enableBlend", "writeToDephBuffer"];


  override denyProperties: string[] = ["active", "parent", "enableLights", "mesh", "time", "drawPrimitiveType",
    ...Object.keys(this.drawingEnums), "blendMode", // inner emuns
    ...this.renderBooleans,


  ]

  @Input() set behaviour(value: EntityBehaviour) {
    this._selectedObject = { key: value.className, type: value.className, property: value };
    this.loadProperties();
  };

  get behaviour() { return this._selectedObject?.property }

  override onValueChanged(property: ITargetObject, value: string | number | boolean): void {
    if ((typeof value == 'number' || typeof value == 'string' || typeof value == 'boolean'))
      this._selectedObject!.property[property.key] = value;
  }

  protected override loadProperties(): void {
    super.loadProperties();

    for (const enumName of Object.keys(this.drawingEnums)) {
      const value = this._selectedObject?.property[enumName];
      const arrayValues: DropdownItem[] = [];
      for (const enumObj of this.drawingEnums[enumName]) {
        arrayValues.push(enumObj)
      }
      if (value != undefined) {

        const p: ITargetProperty = {
          key: enumName,
          type: "enum",
          property: arrayValues,
          value: arrayValues.find(e => e.value == value)
        };

        this._properties.push(p);
      }
    }


    // const renderBooleans = [];
    // for (const prop of Object.keys(this.renderBooleans)) {
    //   if (this._selectedObject?.property[prop]) {
    //     renderBooleans.push({ key: prop, enumOptions: this._selectedObject?.property[prop] });
    //   }
    // }
  }
  onEnumChanged(_t5: ITargetProperty, $event: DropdownItem) {
    debugger

  }
}
