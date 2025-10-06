import { Color } from "omega-game-engine";

export class SceneFog {

  color: Color;
  distance: number;
  density: number;
  enabled: boolean = true;


  constructor(color: Color, distance: number, density: number) {
    this.color = color;
    this.distance = distance;
    this.density = density;
  }
}
