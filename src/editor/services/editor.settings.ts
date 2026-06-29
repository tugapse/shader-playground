import { Injectable } from "@angular/core";
import { IEditorSettings } from "@editor/interfaces/editor-settings";
import { Color, Colors, JsonSerializable, JsonSerializedData } from "@engine";
import { BehaviorSubject } from "rxjs";


export class EditorSettings extends JsonSerializable implements IEditorSettings {
  gridColor: Color; 
  selectedBoundingBoxColor: Color; 
  hoveredBoundingBoxColor: Color;

  constructor() {
    super("EditorSettings");
    this.gridColor = Colors.black;
    this.selectedBoundingBoxColor = Colors.aliceBlue;
    this.hoveredBoundingBoxColor = Colors.aliceBlue;
  }

  override toJsonObject(): JsonSerializedData {
    return this.serializeAutomatically();
  }

  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.deserializeAutomatically(jsonObject);
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

