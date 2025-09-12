import { Injectable } from "@angular/core";
import { IEditorSettings } from "@editor/interfaces/editor-settings";
import { Color, Colors, JsonSerializable, JsonSerializedData } from "omega-game-engine";
import { BehaviorSubject } from "rxjs";


export class EditorSettings extends JsonSerializable implements IEditorSettings {
  sceneEditor!: { gridColor: Color; selectedBoundingBoxColor: Color; hoveredBoundingBoxColor: Color; };
  constructor() {
    super("EditorSettings");
    this.sceneEditor = {
      gridColor: Colors.black,
      hoveredBoundingBoxColor: Colors.green,
      selectedBoundingBoxColor: Colors.darkBlue
    }
  }
  override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      sceneEditor: {
        gridColor: this.sceneEditor.gridColor.toJsonObject(),
        hoveredBoundingBoxColor: this.sceneEditor.hoveredBoundingBoxColor.toJsonObject(),
        selectedBoundingBoxColor: this.sceneEditor.selectedBoundingBoxColor.toJsonObject()
      }
    }
  }

  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.sceneEditor = {
      gridColor: Color.createFromJsonData(jsonObject['sceneEditor']["gridColor"]),
      hoveredBoundingBoxColor: Color.createFromJsonData(jsonObject['sceneEditor']["hoveredBoundingBoxColor"]),
      selectedBoundingBoxColor: Color.createFromJsonData(jsonObject['sceneEditor']["selectedBoundingBoxColor"])
    }
  }


}

@Injectable({ providedIn: 'root' })
export class EditorSettingsService {

  readonly storageKey = "omg_settings";

  private _settings: EditorSettings = new EditorSettings();

  public onSettingsChanged;

  constructor() {
    const item = localStorage.getItem(this.storageKey);

    if (item) {
      this._settings.fromJson(JSON.parse(item));
    } else {
      localStorage.setItem(this.storageKey, JSON.stringify(this._settings.toJsonObject()))
    }
    this.onSettingsChanged = new BehaviorSubject<IEditorSettings>(this._settings)
  }

}

