import { Component, Input } from '@angular/core';
import { InpectorTogglePanel } from "@editor/components/inpector-toggle-panel/inpector-toggle-panel";
import { BooleanInspector } from "@editor/components/inspector/boolean-inspector/boolean-inspector";
import { TextInputInspector } from "@editor/components/inspector/text-input-inspector/text-input-inspector";
import { VectorInspector } from "@editor/components/inspector/vector-inspector/vector-inspector";
import { ColorInspector } from "../color-inspector/color-inspector";
import { ITargetObject, ObjectInspector } from '../object-inspector/object-inspector';
import { CullFace, DephFunction, EntityBehaviour, FaceWinding, RenderLayer } from 'omega-game-engine';

@Component({
  selector: 'editor-behaviour-inspector',
  imports: [ObjectInspector, InpectorTogglePanel, TextInputInspector, BooleanInspector, ColorInspector, VectorInspector],
  templateUrl: './behaviour-inspector.html',
  styleUrl: './behaviour-inspector.scss'
})
export class BehaviourInspector extends ObjectInspector {

  protected drawingEnums: { [key: string]: string[] } = {
    'renderLayer': Object.keys(RenderLayer),
    'cullFace': Object.keys(CullFace),
    'dephMode': Object.keys(DephFunction),
    'faceWinding': Object.keys(FaceWinding)
  }
  protected renderBooleans = [ "enableCullFace", "enableDephTest", "enableBlend", "writeToDephBuffer" ];


  override denyProperties: string[] = ["active", "parent", "enableLights", "mesh", "time", "drawPrimitiveType",
     ...Object.keys(this.drawingEnums),"blendMode", // inner emuns
     ...this.renderBooleans,


  ]

  @Input() set behaviour(value: EntityBehaviour) {
    this._selectedObject = { key: value.className, type: value.className, property: value };
    super.loadProperties();
  };

  get behaviour() { return this._selectedObject?.property }

  override onValueChanged(property: ITargetObject, value: string | number | boolean): void {
    if ((typeof value == 'number' || typeof value == 'string' || typeof value == 'boolean'))
      this._selectedObject!.property[property.key] = value;
  }

  protected override loadProperties(): void {
    super.loadProperties();
    const renderEnums = [];
    for (const prop of Object.keys(this.drawingEnums)) {
      if (this._selectedObject?.property[prop]) {
        renderEnums.push({ key: prop, enumOptions: this.drawingEnums[prop] });
      }
    }

    const renderBooleans = [];
    for (const prop of Object.keys(this.renderBooleans)) {
      if (this._selectedObject?.property[prop]) {
        renderBooleans.push({ key: prop, enumOptions: this._selectedObject?.property[prop] });
      }
    }
  }
}
