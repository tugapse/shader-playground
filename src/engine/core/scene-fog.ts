import { Color } from "@engine";


export enum FogType{
    LINEAR = 0,
    EXPONENTIAL = 1, 
    EXPONEMTIAL_SQUARED = 2
}
export class SceneFog {

  enabled: boolean = true;
  fogType: number = FogType.LINEAR; // Default to Exp fog
  distance: number;
  density: number;
  heightFalloff: number = 0.0; // 0.0 disables height fog
  baseHeight: number = 0.0;
  color: Color;

  constructor(color: Color, distance: number, density: number) {
    this.color = color;
    this.distance = distance;
    this.density = density;
  }
}
