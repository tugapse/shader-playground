import { Injectable } from "@angular/core";
import { IEditorSettings } from "@editor/interfaces/editor-settings";
import {
  Color,
  Colors,
  JsonSerializable,
  JsonSerializedData,
} from "omega-game-engine";
import { BehaviorSubject } from "rxjs";

export class EditorSettings
  extends JsonSerializable
  implements IEditorSettings
{
  public viewportClearColor: Color;
  public gridColor: Color;
  public selectedBoundingBoxColor: Color;
  public hoveredBoundingBoxColor: Color;

  public workspace = {
    showLeftpanel: true,
    showRightpanel: false,
    showFooter: false,
  };

  constructor() {
    super("EditorSettings");
    this.gridColor = Colors.black;
    this.selectedBoundingBoxColor = Colors.aliceBlue;
    this.hoveredBoundingBoxColor = Colors.aliceBlue;
    this.viewportClearColor = Colors.dimGray;
  }

  override toJsonObject(): JsonSerializedData {
    return this.serializeAutomatically();
  }

  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.deserializeAutomatically(jsonObject);
  }
}

@Injectable({ providedIn: "root" })
export class EditorSettingsService {
  readonly storageKey = "omg_settings";

  private _settings: EditorSettings = new EditorSettings();

  public get settings(): EditorSettings {
    return this._settings;
  }

  public onSettingsChanged: BehaviorSubject<IEditorSettings>;

  constructor() {
    const item = localStorage.getItem(this.storageKey);

    if (item) {
      this._settings.fromJson(JSON.parse(item));
    } else {
      this.saveSettings();
    }
    this.onSettingsChanged = new BehaviorSubject<IEditorSettings>(
      this._settings,
    );
  }

  public saveSettings() {
    localStorage.setItem(
      this.storageKey,
      JSON.stringify(this._settings.toJsonObject()),
    );
  }
}
