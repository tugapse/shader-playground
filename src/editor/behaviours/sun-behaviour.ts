import { Color, EntityBehaviour, JsonSerializedData, Light, ObjectInstanciator, RendererBehaviour, SkyboxRenderer, SkyboxShader, Vector3 } from "@engine";
import { ClassType } from "@engine/enums/class-type.enum";
import { vec3 } from "gl-matrix";

export class SunBehaviour extends EntityBehaviour {

  static override instanciate(): SunBehaviour {
    return new SunBehaviour();
  }

  protected override _className = "SunBehaviour";
  

  public timeOfDayText = "12:00";

  public sun = {
    speed: 0.01,
    timeOfDay: 10.0, // 0 to 24, maps to 00:00 to 23:59
    arcHeight: 0.5, // 0 to 1, max height of the sun arc
  };

  public moon = {
    enabled: false, // Enable or disable the moon
    phase: 0.0, // 0 to 1 (full cycle of the moon phase)
    phaseSpeed: 0.0005, // Independent timer for the moon
    color: new Color(0.8, 0.9, 1.0, 1.0) // Pale bluish-white
  };

  public hours = {
    sunrise: 6.0,   // 6:00 AM
    noon: 12.0,     // 12:00 PM
    sunset: 20.0,   // 6:00 PM
    night: 23.0,    // 9:00 PM
  };

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
    this.sun.timeOfDay += elapsed * this.sun.speed * 0.01;
    
    // Loop strictly between 0.0 and 24.0 (00:00 to 23:59)
    if (this.sun.timeOfDay >= 24.0) {
      this.sun.timeOfDay -= 24.0;
    }
    if (this.sun.timeOfDay < 0.0) {
      this.sun.timeOfDay += 24.0;
    }

    // Update independent moon phase
    this.moon.phase += elapsed * this.moon.phaseSpeed * 0.01;
    if (this.moon.phase > 1.0) {
      this.moon.phase -= 1.0;
    }
    if (this.moon.phase < 0.0) {
      this.moon.phase += 1.0;
    }


    // 2. Calculate sun position on a tilted 3D arc
    const sunDistance = 10.0;

    // Clamp arcHeight to the valid range [0, 1] to avoid acos errors
    this.sun.arcHeight = Math.max(0.001, Math.min(0.9999, this.sun.arcHeight));

    // The tilt of the sun's path, based on arcHeight.
    const tiltAngle = Math.acos(this.sun.arcHeight);

    // Position on a simple 2D arc in the XY plane. 
    // Offset by 0.25 so that 0.5 (Noon) is at the top (PI/2), and 0/1 (Midnight) is at the bottom (-PI/2)
    const dailyAngle = ((this.sun.timeOfDay / 24.0) - 0.25) * Math.PI * 2;
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

    if (this.sun.timeOfDay >= this.hours.sunrise && this.sun.timeOfDay < this.hours.noon) { // Sunrise to Noon
      if (scene?.shadowmapRenderer) scene.shadowmapRenderer.enabled = true;
      fromColor = this.colors.sunriseColor;
      toColor = this.colors.noonColor;
      t = (this.sun.timeOfDay - this.hours.sunrise) / (this.hours.noon - this.hours.sunrise);
    } else if (this.sun.timeOfDay >= this.hours.noon && this.sun.timeOfDay < this.hours.sunset) { // Noon to Sunset
      if (scene?.shadowmapRenderer) scene.shadowmapRenderer.enabled = true;
      fromColor = this.colors.noonColor;
      toColor = this.colors.sunsetColor;
      t = (this.sun.timeOfDay - this.hours.noon) / (this.hours.sunset - this.hours.noon);
    } else if (this.sun.timeOfDay >= this.hours.sunset && this.sun.timeOfDay < this.hours.night) { // Sunset to Night
      if (scene?.shadowmapRenderer) scene.shadowmapRenderer.enabled = false;
      fromColor = this.colors.sunsetColor;
      toColor = this.colors.nightColor;
      t = (this.sun.timeOfDay - this.hours.sunset) / (this.hours.night - this.hours.sunset);
    } else { // Night to Sunrise (crosses midnight)
      if (scene?.shadowmapRenderer) scene.shadowmapRenderer.enabled = false;
      fromColor = this.colors.nightColor;
      toColor = this.colors.sunriseColor;
      
      const nightDuration = (24 - this.hours.night) + this.hours.sunrise;
      let elapsedNight = 0;
      if (this.sun.timeOfDay >= this.hours.night) {
        elapsedNight = this.sun.timeOfDay - this.hours.night;
      } else {
        elapsedNight = (24 - this.hours.night) + this.sun.timeOfDay;
      }
      t = elapsedNight / nightDuration;
    }
    
    t = Math.max(0, Math.min(1, t)); // Clamp t firmly between 0 and 1

    // Update the 24h clock display
    const hours = Math.floor(this.sun.timeOfDay);
    const minutes = Math.floor((this.sun.timeOfDay % 1) * 60);
    this.timeOfDayText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    light.color = Color.lerp(fromColor, toColor, t);
    if (scene) {
      scene.clearColor = light.color;
      scene.fog.color = light.color;
      const skyboxEntity = scene.objects.find(o => o.getBehaviour(SkyboxRenderer));
      if (skyboxEntity) {
        const skyboxRenderer = skyboxEntity.getBehaviour(SkyboxRenderer) as SkyboxRenderer;
        if (skyboxRenderer.shader && skyboxRenderer.shader instanceof SkyboxShader) {
          const shader = skyboxRenderer.shader as SkyboxShader;
          shader._useSun = 1;
          const normalizedDir = vec3.normalize(vec3.create(), this.transform.worldPosition);
          shader._sunDirection.set(normalizedDir[0], normalizedDir[1], normalizedDir[2]);
          shader._sunColor = light.color;
          // Place the moon exactly opposite to the sun
          shader._useMoon = this.moon.enabled ? 1 : 0;
          shader._moonDirection.set(-normalizedDir[0], -normalizedDir[1], -normalizedDir[2]);
          shader._moonPhase = this.moon.phase;

          // Blend the base moon color with the atmospheric sun color
          shader._moonColor = Color.lerp(this.moon.color, light.color, 0.4);
        }
      }
    }
  }

  public override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      sun: { ...this.sun },
      moon: {
        enabled: this.moon.enabled,
        phase: this.moon.phase,
        phaseSpeed: this.moon.phaseSpeed,
        color: this.moon.color.toJsonObject()
      },
      hours: { ...this.hours },
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

    if (jsonObject['sun']) {
      this.sun = { ...this.sun, ...jsonObject['sun'] };
    } else {
      if (jsonObject['speed'] !== undefined) this.sun.speed = jsonObject['speed'];
      if (jsonObject['timeOfDay'] !== undefined) this.sun.timeOfDay = jsonObject['timeOfDay'];
      if (jsonObject['arcHeight'] !== undefined) this.sun.arcHeight = jsonObject['arcHeight'];
    }

    if (jsonObject['moon']) {
      if (jsonObject['moon'].enabled !== undefined) this.moon.enabled = jsonObject['moon'].enabled;
      if (jsonObject['moon'].phase !== undefined) this.moon.phase = jsonObject['moon'].phase;
      if (jsonObject['moon'].phaseSpeed !== undefined) this.moon.phaseSpeed = jsonObject['moon'].phaseSpeed;
      if (jsonObject['moon'].color) this.moon.color.fromJson(jsonObject['moon'].color);
    } else {
      if (jsonObject['moonPhase'] !== undefined) this.moon.phase = jsonObject['moonPhase'];
      if (jsonObject['moonPhaseSpeed'] !== undefined) this.moon.phaseSpeed = jsonObject['moonPhaseSpeed'];
    }

    if (jsonObject['hours']) {
      this.hours = { ...this.hours, ...jsonObject['hours'] };
    } else {
      if (jsonObject['sunriseHour'] !== undefined) this.hours.sunrise = jsonObject['sunriseHour'];
      if (jsonObject['noonHour'] !== undefined) this.hours.noon = jsonObject['noonHour'];
      if (jsonObject['sunsetHour'] !== undefined) this.hours.sunset = jsonObject['sunsetHour'];
      if (jsonObject['nightHour'] !== undefined) this.hours.night = jsonObject['nightHour'];
    }

    if (jsonObject['colors']) {
      this.colors.sunriseColor.fromJson(jsonObject['colors'].sunriseColor);
      this.colors.noonColor.fromJson(jsonObject['colors'].noonColor);
      this.colors.sunsetColor.fromJson(jsonObject['colors'].sunsetColor);
      this.colors.nightColor.fromJson(jsonObject['colors'].nightColor);
    }
  }
}

ObjectInstanciator.addDependency("SunBehaviour", SunBehaviour.instanciate,{
  name: "SunBehaviour",
  type: ClassType.EntityBehaviour,
  path: "Behaviours/SunBehaviour",
  description: "Controls the sun's position, color, and the day/night cycle in the scene. It simulates the sun's movement across the sky based on a time of day system, allowing for dynamic lighting changes throughout the day. The behaviour also includes an optional moon simulation that can be enabled for night scenes."
});
