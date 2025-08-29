import { Component, Input } from '@angular/core';
import { InpectorTogglePanel } from "@editor/components/inpector-toggle-panel/inpector-toggle-panel";
import { BooleanInspector } from "@editor/components/inspector/boolean-inspector/boolean-inspector";
import { TextInputInspector } from "@editor/components/inspector/text-input-inspector/text-input-inspector";
import { VectorInspector } from "@editor/components/inspector/vector-inspector/vector-inspector";
import { EntityBehaviour } from '@engine/behaviours';
import { ColorInspector } from "../color-inspector/color-inspector";
import { ITargetObject, ObjectInspector } from '../object-inspector/object-inspector';

@Component({
  selector: 'editor-behaviour-inspector',
  imports: [ObjectInspector, InpectorTogglePanel, TextInputInspector, BooleanInspector, ColorInspector, VectorInspector],
  templateUrl: './behaviour-inspector.html',
  styleUrl: './behaviour-inspector.scss'
})
export class BehaviourInspector extends ObjectInspector {

  override denyProperties: string[]=["active"]


  @Input() set behaviour(value: EntityBehaviour) {
    this._selectedObject = { key: value.className, type: value.className, property: value };
    super.loadProperties();
    debugger
  };

  get behaviour() { return this._selectedObject?.property }

  override onValueChanged(property: ITargetObject, value: string | number | boolean): void {
    if ((typeof value == 'number' || typeof value == 'string' || typeof value == 'boolean'))
      this._selectedObject!.property[property.key] = value;
  }
}
