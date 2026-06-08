import { Color, Colors } from "@engine/core";
import { CubemapMaterial } from "./cubemap-material";
import { JsonSerializedData } from "@engine";

export class SkyboxMaterial extends CubemapMaterial {

  protected override _className: string = "EditorSkyboxMaterial";

    // Procedural sky properties
  public skyColor: Color = new Color(0.35, 0.53, 0.7, 1.0);
  public horizonColor: Color = new Color(0.7, 0.75, 0.8, 1.0); 
  public groundColor: Color = new Color(0.2, 0.2, 0.2, 1.0);
  public exponent: number = 0.6;


  override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      horizonColor: this.horizonColor.toJsonObject(),
      skyColor: this.skyColor.toJsonObject(),
      groundColor: this.groundColor.toJsonObject(),
      exponent: this.exponent,
    }
  }

  override async fromJson(jsonObject: JsonSerializedData): Promise<void> {
    await super.fromJson(jsonObject);
    this.horizonColor = Color.createFromJsonData(jsonObject['horizonColor']);
    this.skyColor = Color.createFromJsonData(jsonObject['skyColor']);
    this.groundColor = Color.createFromJsonData(jsonObject['groundColor']);
    this.exponent = jsonObject['exponent'] || this.exponent;   
  }

}