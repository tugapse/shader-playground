import {
  JsonSerializable,
  Color,
  Colors,
  JsonSerializedData,
} from "omega-game-engine";

export class EditorSettings extends JsonSerializable {
  public viewportClearColor: Color;
  public gridColor: Color;
  public selectedBoundingBoxColor: Color;
  public hoveredBoundingBoxColor: Color;

  public workspace = {
    showLeftpanel: true,
    showRightpanel: false,
    showFooter: false,
  };
  public viewport = {
    isEngineStatsVisible: false,
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
