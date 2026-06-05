import { Color, EntityBehaviour, JsonSerializedData, Light, ObjectInstanciator, RendererBehaviour, Vector3 } from "@engine";
import { vec3 } from "gl-matrix";

export class SunBehaviour extends EntityBehaviour {

  static override instanciate(): SunBehaviour {
    return new SunBehaviour();
  }

  protected override _className = "SunBehaviour";
  public timeOfDayText = "12:00";
  public speed = 0.01;
  public timeOfDay = 12.0; // 0 to 24, maps to 00:00 to 23:59
  public arcHeight = 0.5; // 0 to 1, max height of the sun arc

  // Configurable hours for the day/night cycle (0 - 24)
  public sunriseHour = 6.0;   // 6:00 AM
  public noonHour = 12.0;     // 12:00 PM
  public sunsetHour = 18.0;   // 6:00 PM
  public nightHour = 21.0;    // 9:00 PM

  // Color palette for the day/night cycle
  public colors = {
    sunriseColor: new Color(255 / 255, 160 / 255, 120 / 255),
    noonColor: new Color(255 / 255, 245 / 255, 230 / 255),
    sunsetColor: new Color(255 / 255, 90 / 255, 50 / 255),
    nightColor: new Color(15 / 255, 25 / 255, 45 / 255),
  }

  override initialize(): boolean {
    this.update(1);
    return super.initialize();
  }

  public override update(elapsed: number): void {
    // 1. Update time of day
    this.timeOfDay += elapsed * this.speed * 0.01;
    
    // Loop strictly between 0.0 and 24.0 (00:00 to 23:59)
    if (this.timeOfDay >= 24.0) {
      this.timeOfDay -= 24.0;
    }
    if (this.timeOfDay < 0.0) {
      this.timeOfDay += 24.0;
    }


    // 2. Calculate sun position on a tilted 3D arc
    const sunDistance = 1.0;

    // Clamp arcHeight to the valid range [0, 1] to avoid acos errors
    this.arcHeight = Math.max(0.001, Math.min(0.9999, this.arcHeight));

    // The tilt of the sun's path, based on arcHeight.
    const tiltAngle = Math.acos(this.arcHeight);

    // Position on a simple 2D arc in the XY plane. 
    // Offset by 0.25 so that 0.5 (Noon) is at the top (PI/2), and 0/1 (Midnight) is at the bottom (-PI/2)
    const dailyAngle = ((this.timeOfDay / 24.0) - 0.25) * Math.PI * 2;
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

    const scene = light.scene;
    let fromColor: Color;
    let toColor: Color;
    let t: number;

    if (this.timeOfDay >= this.sunriseHour && this.timeOfDay < this.noonHour) { // Sunrise to Noon
      if (scene?.shadowmapRenderer) scene.shadowmapRenderer.enabled = true;
      fromColor = this.colors.sunriseColor;
      toColor = this.colors.noonColor;
      t = (this.timeOfDay - this.sunriseHour) / (this.noonHour - this.sunriseHour);
    } else if (this.timeOfDay >= this.noonHour && this.timeOfDay < this.sunsetHour) { // Noon to Sunset
      if (scene?.shadowmapRenderer) scene.shadowmapRenderer.enabled = true;
      fromColor = this.colors.noonColor;
      toColor = this.colors.sunsetColor;
      t = (this.timeOfDay - this.noonHour) / (this.sunsetHour - this.noonHour);
    } else if (this.timeOfDay >= this.sunsetHour && this.timeOfDay < this.nightHour) { // Sunset to Night
      if (scene?.shadowmapRenderer) scene.shadowmapRenderer.enabled = false;
      fromColor = this.colors.sunsetColor;
      toColor = this.colors.nightColor;
      t = (this.timeOfDay - this.sunsetHour) / (this.nightHour - this.sunsetHour);
    } else { // Night to Sunrise (crosses midnight)
      if (scene?.shadowmapRenderer) scene.shadowmapRenderer.enabled = false;
      fromColor = this.colors.nightColor;
      toColor = this.colors.sunriseColor;
      
      const nightDuration = (24 - this.nightHour) + this.sunriseHour;
      let elapsedNight = 0;
      if (this.timeOfDay >= this.nightHour) {
        elapsedNight = this.timeOfDay - this.nightHour;
      } else {
        elapsedNight = (24 - this.nightHour) + this.timeOfDay;
      }
      t = elapsedNight / nightDuration;
    }
    
    t = Math.max(0, Math.min(1, t)); // Clamp t firmly between 0 and 1

    // Update the 24h clock display
    const hours = Math.floor(this.timeOfDay);
    const minutes = Math.floor((this.timeOfDay % 1) * 60);
    this.timeOfDayText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    light.color = Color.lerp(fromColor, toColor, t);
    if (scene) {
      scene.clearColor = light.color;
    }
  }

  public override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      speed: this.speed,
      timeOfDay: this.timeOfDay,
      arcHeight: this.arcHeight,
      sunriseHour: this.sunriseHour,
      noonHour: this.noonHour,
      sunsetHour: this.sunsetHour,
      nightHour: this.nightHour,
      colors: {
        sunriseColor: this.colors.sunriseColor.toJsonObject(),
        noonColor: this.colors.noonColor.toJsonObject(),
        sunsetColor: this.colors.sunsetColor.toJsonObject(),
        nightColor: this.colors.nightColor.toJsonObject(),
      }
    }
  }

  public override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.speed = jsonObject['speed'];
    this.timeOfDay = jsonObject['timeOfDay'];
    this.arcHeight = jsonObject['arcHeight'];
    if (jsonObject['sunriseHour'] !== undefined) this.sunriseHour = jsonObject['sunriseHour'];
    if (jsonObject['noonHour'] !== undefined) this.noonHour = jsonObject['noonHour'];
    if (jsonObject['sunsetHour'] !== undefined) this.sunsetHour = jsonObject['sunsetHour'];
    if (jsonObject['nightHour'] !== undefined) this.nightHour = jsonObject['nightHour'];
    if (jsonObject['colors']) {
      this.colors.sunriseColor.fromJson(jsonObject['colors'].sunriseColor);
      this.colors.noonColor.fromJson(jsonObject['colors'].noonColor);
      this.colors.sunsetColor.fromJson(jsonObject['colors'].sunsetColor);
      this.colors.nightColor.fromJson(jsonObject['colors'].nightColor);
    }
  }
}

ObjectInstanciator.addDependency("SunBehaviour", SunBehaviour.instanciate);
