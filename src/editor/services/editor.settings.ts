import { Injectable } from "@angular/core";
import { EditorSettings } from "@editor/interfaces/editor-settings";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: "root" })
export class EditorSettingsService {
  readonly storageKey = "omg_settings";

  private _settings: EditorSettings = new EditorSettings();

  public get settings(): EditorSettings {
    return this._settings;
  }

  public onSettingsChanged: BehaviorSubject<EditorSettings>;

  constructor() {
    const item = localStorage.getItem(this.storageKey);

    if (item) {
      this._settings.fromJson(JSON.parse(item));
    } else {
      this.saveSettings();
    }
    this.onSettingsChanged = new BehaviorSubject<EditorSettings>(
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
