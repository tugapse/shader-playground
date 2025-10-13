import { Color, EntityBehaviour, Light, ObjectInstanciator, Vector3 } from "@engine";
import { vec3 } from "gl-matrix";

export class SunBehaviour extends EntityBehaviour {

  static override instanciate(): SunBehaviour {
    return new SunBehaviour()
  }

  protected override _className = "SunBehaviour";

  public speed = 0.01;
  public timeOfDay = 0.0; // 0 to 1, 0 is sunrise, 0.5 is noon, 1 is sunset
  public arcHeight = 0.5; // 0 to 1, max height of the sun arc
  public cycleOvershoot = 0.2; // How much time the sun travels "underground" before reset

  // Color palette for the day/night cycle
  public sunriseColor = new Color(255 / 255, 215 / 255, 180 / 255);
  public noonColor = new Color(255 / 255, 255 / 255, 240 / 255);
  public sunsetColor = new Color(255 / 255, 180 / 255, 120 / 255);
  public nightColor = new Color(10 / 255, 20 / 255, 40 / 255);

  public override update(elapsed: number): void {
    // 1. Update time of day
    this.timeOfDay += elapsed * this.speed * 0.01;
    this.timeOfDay = this.timeOfDay % (1.0 + this.cycleOvershoot); // Loop time

    // 2. Calculate sun position on a tilted 3D arc
    const sunDistance = 1.0;

    // Clamp arcHeight to the valid range [0, 1] to avoid acos errors
    this.arcHeight = Math.max(0.001, Math.min(0.9999, this.arcHeight));

    // The tilt of the sun's path, based on arcHeight.
    const tiltAngle = Math.acos(this.arcHeight);

    // Position on a simple 2D arc in the XY plane
    const dailyAngle = this.timeOfDay * Math.PI;
    const x2d = Math.cos(dailyAngle) * sunDistance;
    const y2d = Math.sin(dailyAngle) * sunDistance;

    // Rotate the 2D position around the X-axis to apply the tilt
    const x = x2d;
    const y = y2d * Math.cos(tiltAngle);
    const z = -y2d * Math.sin(tiltAngle);

    this.transform.setWorldPosition(x, y, z);
    this.transform.lookAt(new Vector3(0, 0, 0));

    // 3. Update light color based on time of day
    this.updateLightColor();
  }

  private updateLightColor(): void {
    const light = this.parent as Light;
    if (!light) return;

    let fromColor: Color;
    let toColor: Color;
    let t: number;

    if (this.timeOfDay >= 0 && this.timeOfDay < 0.5) { // Sunrise to Noon
      fromColor = this.sunriseColor;
      toColor = this.noonColor;
      t = this.timeOfDay / 0.5;
    } else if (this.timeOfDay >= 0.5 && this.timeOfDay <= 1.0) { // Noon to Sunset
      fromColor = this.noonColor;
      toColor = this.sunsetColor;
      t = (this.timeOfDay - 0.5) / 0.5;
    } else { // Night
      // Blend from sunset to night, and then hold night color
      fromColor = this.sunsetColor;
      toColor = this.nightColor;
      t = (this.timeOfDay - 1.0) / (this.cycleOvershoot / 2);
      t = Math.min(1, t); // Clamp at 1, so it holds the night color
    }

    light.color = Color.lerp(fromColor, toColor, t);
  }
}

ObjectInstanciator.addDependency("SunBehaviour", SunBehaviour.instanciate);
