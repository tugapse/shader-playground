import { Color } from "@engine";

export class SceneFog {

  color: Color;
  distance: number;
  density: number;
  enabled: boolean = true;
  fogType: number = 1; // Default to Exp fog
  heightFalloff: number = 0.0; // 0.0 disables height fog
  baseHeight: number = 0.0;

  constructor(color: Color, distance: number, density: number) {
    this.color = color;
    this.distance = distance;
    this.density = density;
  }
}
