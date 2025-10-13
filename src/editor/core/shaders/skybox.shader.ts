import { CubemapMaterial, Colors, JsonSerializedData, Color, SkyboxShader } from "@engine";


export enum EditorUniforms {

  U_HORIZON_COLOR = "u_horizonColor",
  U_HORIZON_START = "u_horizonStart",
  U_HORIZON_HEIGHT = "u_horizonHeight",
  U_GRADIENT = "u_gradient",
  U_EXPONENTIAL = "u_exponential",
  U_EXPOSURE = "u_exposure",
}

export class EditorSkyboxMaterial extends CubemapMaterial {

  protected override _className: string = "EditorSkyboxMaterial";

  public horizonColor = Colors.wheat;
  public exposure: number = 1.183;
  public horizonStart: number = -0.11;
  public horizonHeight: number = 0.1;
  public horizonFade: number = 0.3;
  constructor() {
    super();
    // this.horizonColor = this.color.clone();
  }

  override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      horizonColor: this.horizonColor.toJsonObject(),
      horizonStart: this.horizonStart,
      horizonFade: this.horizonFade,
      exposure: this.exposure,
    }
  }

  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.horizonColor = Color.createFromJsonData(jsonObject['horizonColor']);
    this.horizonStart = jsonObject['horizonStart'];
    this.horizonFade = jsonObject['horizonFade'];
    this.exposure = jsonObject['exposure'];
  }

}


export class EditorSkyboxShader extends SkyboxShader {

  static override instanciate(gl: WebGL2RenderingContext, material: EditorSkyboxMaterial): EditorSkyboxShader {
    return new EditorSkyboxShader(gl, material);
  }

  constructor(gl: WebGL2RenderingContext, public override material: EditorSkyboxMaterial) {
    super(gl, material);

  }


  override loadDataIntoShader(): void {
    if (!this.material) return

    if (!this.material.horizonColor) {
      this.material.horizonColor = this.material.color.clone();
    };
    super.loadDataIntoShader();
    this.setVec4(EditorUniforms.U_HORIZON_COLOR, this.material.horizonColor.toVec4());
    this.setFloat(EditorUniforms.U_HORIZON_START, this.material.horizonStart);
    this.setFloat(EditorUniforms.U_HORIZON_HEIGHT, this.material.horizonHeight);
    this.setFloat(EditorUniforms.U_EXPOSURE, this.material.exposure);
    this.setFloat(EditorUniforms.U_GRADIENT, this.material.horizonFade);
  }



  protected override _className: string = "EditorSkyboxShader";


}

