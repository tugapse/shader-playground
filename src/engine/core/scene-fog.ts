import { Color, Colors, JsonSerializable, JsonSerializedData } from '@engine';

export enum FogType {
  LINEAR = 0,
  EXPONENTIAL = 1,
  EXPONEMTIAL_SQUARED = 2,
}
export class SceneFog extends JsonSerializable {
  enabled: boolean = true;
  fogType: number = FogType.LINEAR; // Default to Exp fog
  distance: number = 0.01;
  density: number = 0.001;
  heightFalloff: number = 0.0; // 0.0 disables height fog
  baseHeight: number = 0.0;
  color: Color = Colors.grey;
  
  constructor(public override name = 'Scene Fog') {
    super('SceneFog');
  }

  public override toJsonObject(): JsonSerializedData {
    return this.serializeAutomatically();
  }

  public override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.deserializeAutomatically(jsonObject);
  }
}
