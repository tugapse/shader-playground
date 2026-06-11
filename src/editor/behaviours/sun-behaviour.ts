import {
  Color,
  EntityType,
  DirectionalLight,
  EntityBehaviour,
  GlEntity,
  JsonSerializedData,
  Light,
  ObjectInstanciator,
  RendererBehaviour,
  SkyboxRenderer,
  SkyboxShader,
  Vector3,
} from '@engine';
import { NumberRange } from '@engine/core/range';
import { ClassType } from '@engine/enums/class-type.enum';
import { vec3 } from 'gl-matrix';

// Helper for smooth (ease-in, ease-out) interpolation
const smoothstep = (t: number): number => {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * (3 - 2 * clamped);
};

/**
 * Controls the sun's position, color, and the day/night cycle in the scene.
 * This behaviour simulates the sun's movement across the sky based on a time-of-day system,
 * allowing for dynamic lighting changes. It also manages an optional moon simulation for night scenes.
 * This component should be attached to an entity that represents the sun, typically a DirectionalLight.
 */
export class SunBehaviour extends EntityBehaviour {

  static override instanciate(): SunBehaviour {
    return new SunBehaviour();
  }

  protected override _className = 'SunBehaviour';
  private _skyboxRenderer: SkyboxRenderer | undefined;
  protected moonLight :DirectionalLight | undefined;

  /** Settings related to the passage of time in the day/night cycle. */
  public daySettings = {
    /** The speed multiplier for the time of day progression. */
    speed: new NumberRange(0, 0, 100, 1),
    /** The current time of day, from 0 (midnight) to 24 (next midnight). */
    timeOfDay: new NumberRange(11, 0, 24.01, 0.5),
  };

  /** Settings for the sun's appearance and path. */
  public sun = {
    /** Toggles the visibility and effect of the sun in the skybox. */
    show: true,
    /** Controls the height of the sun's arc at noon. 0 is on the horizon, 1 is directly overhead. */
    sunHeight: new NumberRange(0.725, 0, 0.9, 0.015),
    /** The size of the sun's disc in the skybox. */
    sunSize: new NumberRange(0.999, 0.8, 1.04, 0.00000001),
    /** The falloff/softness of the sun's glow in the skybox. */
    sunFalloff: new NumberRange(0.01, 0.00001, 0.2, 0.000001),
  };

  /** Settings for the moon's appearance and cycle. */
  public moon = {
    /** Toggles the visibility and effect of the moon in the skybox. */
    show: true,
    /** The base color of the moon. */
    color: new Color(0.8, 0.9, 1.0, 1.0),
    /** The speed at which the moon's phase changes. */
    phaseSpeed: 0.0005,
    /** The current phase of the moon, from 0 (new moon) to 1 (new moon again). */
    phase: new NumberRange(0, 0, 1.01, 0.01),
    useDirectionalLight:false
  };

  /** Settings for shadow appearance during the day/night cycle. */
  public shadows = {
    /** The strength of shadows at night (e.g., from the moon). */
    nightStrength: new NumberRange(0.2, 0, 1, 0.01),
    /** The duration of the shadow fade-in/out transition in hours (e.g., 0.5 for 30 minutes). */
    fadeDuration: new NumberRange(0.5, 0, 2, 0.1),
  };
  /** Key time points in the 24-hour day cycle. */
  public hours = {
    sunrise: 6.0, // 6:00 AM
    noon: 12.0, // 12:00 PM
    sunset: 18.0, // 6:00 PM
    night: 20.0, // 8:00 PM
  };

  /** Color palette for the day/night cycle. */
  public colors = {
    sunriseColor: new Color(255 / 255, 210 / 255, 130 / 255), // Soft gold
    noonColor: new Color(240 / 255, 245 / 255, 255 / 255), // Light, cool white
    sunsetColor: new Color(255 / 255, 180 / 255, 80 / 255), // Golden orange
    nightColor: new Color(20 / 255, 30 / 255, 50 / 255), // Dark slate blue
  };

  public dayPaseColors = {
    sunriseSkyColor: new Color(100 / 255, 150 / 255, 220 / 255), // Medium blue
    sunriseHorizonColor: new Color(255 / 255, 150 / 255, 40 / 255), // Bright orange
    noonSkyColor: new Color(60 / 255, 140 / 255, 220 / 255), // Clear blue
    noonHorizonColor: new Color(170 / 255, 210 / 255, 240 / 255), // Light hazy blue
    sunsetSkyColor: new Color(40 / 255, 60 / 255, 120 / 255), // Purplish blue
    sunsetHorizonColor: new Color(255 / 255, 100 / 255, 40 / 255), // Deep orange-red
    nightSkyColor: new Color(5 / 255, 5 / 255, 15 / 255), // Almost black
    nightHorizonColor: new Color(10 / 255, 15 / 255, 25 / 255), // Very dark blue
  };

  override initialize(): boolean {
    const init = super.initialize();
    this._skyboxRenderer = this.parent.scene?.objects
      .find((o: GlEntity) => o.getBehaviour(SkyboxRenderer))
      ?.getBehaviour(SkyboxRenderer);
    this.update(0);
    return init;
  }

  public override update(elapsed: number): void {
    this.updateTime(elapsed);
    const light = this.parent as DirectionalLight;
    const moonLight = this.moonLight || this.parent.scene.lights.find(o=>o.tag == 'MoonLight') as DirectionalLight;
    if(this.moon.useDirectionalLight == true){
      if(!moonLight){
         this.moonLight = new DirectionalLight('MoonLight')
         this.moonLight.tag = 'MoonLight';
        this.moonLight.color = this.colors.nightColor;
        this.moonLight.transform.setParent(this.transform)
        this.parent.scene.addEntity(this.moonLight)
      }
    }

    if (!light || light.entityType !== EntityType.LIGHT_DIRECTIONAL) {
      return;
    }

    this.updateSunPosition(light,moonLight);
    this.updateLightColor(light);
  }

  /**
   * Updates the time of day and moon phase based on the elapsed time.
   * The time of day loops between 0 and 24, and the moon phase loops between 0 and 1.
   * @param elapsed The time in seconds since the last frame.
   */
  private updateTime(elapsed: number): void {
    if (this.parent.scene.isRunning) {
      this.daySettings.timeOfDay.value +=
        elapsed * this.daySettings.speed.value * 0.01;

      if (this.daySettings.timeOfDay.value >= 24.0) {
        this.daySettings.timeOfDay.value -= 24.0;
      }
      if (this.daySettings.timeOfDay.value < 0.0) {
        this.daySettings.timeOfDay.value += 24.0;
      }
    }

    if (this.moon.show) {
      this.moon.phase.value += elapsed * this.moon.phaseSpeed * 0.01;
      if (this.moon.phase.value > 1.0) {
        this.moon.phase.value -= 1.0;
      }
      if (this.moon.phase.value < 0.0) {
        this.moon.phase.value += 1.0;
      }
    }
  }

  /**
   * Calculates and sets the sun's position in the sky.
   * The sun follows a tilted arc path, simulating its daily journey.
   * The height and tilt of the arc can be configured.
   */
  private updateSunPosition(light: DirectionalLight | undefined, moonLight:DirectionalLight | undefined): void {
    if (!light) return;
    const sunDistance = 1.0;
    const tiltAngle = Math.acos(this.sun.sunHeight.value);

    // Convert time of day to an angle for the sun's circular path.
    // The -0.25 offset places noon (0.5) at the top of the arc (Math.PI / 2).
    const dailyAngle =
      (this.daySettings.timeOfDay.value / 24.0 - 0.25) * Math.PI * 2;
    const x2d = Math.cos(dailyAngle) * sunDistance;
    const y2d = Math.sin(dailyAngle) * sunDistance;

    // Rotate the 2D position around the X-axis to apply the tilt, creating a 3D arc.
    const x = x2d;
    const y = y2d * Math.cos(tiltAngle);
    const z = -y2d * Math.sin(tiltAngle);

    light.transform.setWorldPosition(x, y, z);
    light.transform.lookAt(new Vector3(0, 0, 0));

    if(moonLight){
      moonLight.transform.setWorldPosition(-x, -y, -z);
      moonLight.transform.lookAt(new Vector3(0, 0, 0));
    } 
  }

  /**
   * Determines the correct color transition and progress (delta) based on the current time of day.
   * @returns An object containing the starting color, ending color, and the interpolation factor (delta).
   */
  private getInterpolationData(): {
    fromLightColor: Color;
    toLightColor: Color;
    fromSkyColor: Color;
    toSkyColor: Color;
    fromHorizonColor: Color;
    toHorizonColor: Color;
    delta: number;
  } {
    const time = this.daySettings.timeOfDay.value;
    const { sunrise, noon, sunset, night } = this.hours;
    const { sunriseColor, noonColor, sunsetColor, nightColor } = this.colors;
    const {
      sunriseSkyColor,
      sunriseHorizonColor,
      noonSkyColor,
      noonHorizonColor,
      sunsetSkyColor,
      sunsetHorizonColor,
      nightSkyColor,
      nightHorizonColor,
    } = this.dayPaseColors;

    if (time >= sunrise && time < noon) {
      // Sunrise to Noon
      return {
        fromLightColor: sunriseColor,
        toLightColor: noonColor,
        fromSkyColor: sunriseSkyColor,
        toSkyColor: noonSkyColor,
        fromHorizonColor: sunriseHorizonColor,
        toHorizonColor: noonHorizonColor,
        delta: (time - sunrise) / (noon - sunrise),
      };
    } else if (time >= noon && time < sunset) {
      // Noon to Sunset
      return {
        fromLightColor: noonColor,
        toLightColor: sunsetColor,
        fromSkyColor: noonSkyColor,
        toSkyColor: sunsetSkyColor,
        fromHorizonColor: noonHorizonColor,
        toHorizonColor: sunsetHorizonColor,
        delta: (time - noon) / (sunset - noon),
      };
    } else if (time >= sunset && time < night) {
      // Sunset to Night
      return {
        fromLightColor: sunsetColor,
        toLightColor: nightColor,
        fromSkyColor: sunsetSkyColor,
        toSkyColor: nightSkyColor,
        fromHorizonColor: sunsetHorizonColor,
        toHorizonColor: nightHorizonColor,
        delta: (time - sunset) / (night - sunset),
      };
    } else {
      // Night to Sunrise (crosses midnight)
      const nightDuration = 24 - night + sunrise;
      const elapsedNight = time >= night ? time - night : 24 - night + time;
      return {
        fromLightColor: nightColor,
        toLightColor: sunriseColor,
        fromSkyColor: nightSkyColor,
        toSkyColor: sunriseSkyColor,
        fromHorizonColor: nightHorizonColor,
        toHorizonColor: sunriseHorizonColor,
        delta: elapsedNight / nightDuration,
      };
    }
  }

  /**
   * Updates the main directional light's color and scene properties based on the time of day.
   */
  private updateLightColor(light: DirectionalLight | undefined): void {
    if (!light) return;

    const time = this.daySettings.timeOfDay.value;
    const isNight = time < this.hours.sunrise || time >= this.hours.sunset;

    // During the day, light direction is forward. At night, it's backward (from sun's POV, which is moon's forward).
    light.invertLightDirection = !isNight;

    const {
      fromLightColor,
      toLightColor,
      fromSkyColor,
      toSkyColor,
      fromHorizonColor,
      toHorizonColor,
      delta,
    } = this.getInterpolationData();
    const clampedDelta = Math.max(0, Math.min(1, delta));

    light.color = Color.lerp(fromLightColor, toLightColor, clampedDelta);

    const shadowRenderer = this.parent.scene.shadowmapRenderer;
    if (shadowRenderer) {
      shadowRenderer.shadowstrength.value = this._calculateShadowStrength(
        time,
        shadowRenderer.shadowstrength.max,
      );
    }
    this.updateSceneColors(light.color);
    this.updateSkybox(
      light,
      fromSkyColor,
      toSkyColor,
      fromHorizonColor,
      toHorizonColor,
      clampedDelta,
      isNight,
    );
  }

  /**
   * Calculates the appropriate shadow strength based on the time of day.
   * @param time The current time of day (0-24).
   * @param maxDayStrength The maximum shadow strength during the day.
   * @returns The calculated shadow strength (0-1).
   */
  private _calculateShadowStrength(time: number, maxDayStrength: number): number {
    let shadowStrength = 0.0;
    const dayStrength = maxDayStrength;
    const nightStrength = this.shadows.nightStrength.value;
    const fadeDuration = this.shadows.fadeDuration.value;

    const sunsetFadeStart = this.hours.sunset - fadeDuration;
    const nightFadeEnd = this.hours.sunset + fadeDuration;
    const sunriseFadeStart = this.hours.sunrise - fadeDuration;
    const sunriseFadeEnd = this.hours.sunrise + fadeDuration;

    if (time >= sunriseFadeEnd && time < sunsetFadeStart) {
      // Full day
      shadowStrength = dayStrength;
    } else if (time >= sunsetFadeStart && time < this.hours.sunset) {
      // Fading out day shadow
      const progress = (time - sunsetFadeStart) / (this.hours.sunset - sunsetFadeStart);
      shadowStrength = (1 - smoothstep(progress)) * dayStrength;
    } else if (time >= this.hours.sunset && time < nightFadeEnd) {
      // Fading in night shadow
      const progress = (time - this.hours.sunset) / (nightFadeEnd - this.hours.sunset);
      shadowStrength = smoothstep(progress) * nightStrength;
    } else if (time >= sunriseFadeStart && time < this.hours.sunrise) {
      // Fading out night shadow
      const progress = (time - sunriseFadeStart) / (this.hours.sunrise - sunriseFadeStart);
      shadowStrength = (1 - smoothstep(progress)) * nightStrength;
    } else if (time >= this.hours.sunrise && time < sunriseFadeEnd) {
      // Fading in day shadow
      const progress = (time - this.hours.sunrise) / (sunriseFadeEnd - this.hours.sunrise);
      shadowStrength = smoothstep(progress) * dayStrength;
    } else {
      // Full night
      shadowStrength = nightStrength;
    }
    return Math.max(0, shadowStrength);
  }
  /**
   * Updates the scene's ambient colors (background and fog) to match the light color.
   * @param The color to apply to the scene.
   */
  private updateSceneColors(color: Color): void {
    const scene = this.parent.scene;
    if (scene) {
      scene.clearColor = color;
      scene.fog.color = color;
    }
  }

  /**
   * Finds the SkyboxRenderer in the scene and triggers an update of its shader variables.
   * @param light The main directional light of the scene.
   */
  private updateSkybox(
    light: DirectionalLight | undefined,
    fromSkyColor: Color,
    toSkyColor: Color,
    fromHorizonColor: Color,
    toHorizonColor: Color,
    delta: number,
    isNight: boolean,
  ): void {
    const scene = this.parent.scene;
    if (!scene || !light) {
      return;
    }

    if (!this._skyboxRenderer) {
      this._skyboxRenderer = scene.objects
        .find((o: GlEntity) => o.getBehaviour(SkyboxRenderer))
        ?.getBehaviour(SkyboxRenderer);
    }

    if (this._skyboxRenderer?.shader instanceof SkyboxShader) {
      this._updateSkyboxShaderVariables(
        this._skyboxRenderer, light, fromSkyColor, toSkyColor,
        fromHorizonColor, toHorizonColor, delta, isNight,
      );
    }
  }

  /**
   * Passes calculated sun and moon data to the Skybox shader as uniforms.
   * @param skyboxRenderer The renderer containing the skybox shader.
   * @param light The main directional light.
   */
  private _updateSkyboxShaderVariables(
    skyboxRenderer: SkyboxRenderer,
    light: Light,
    fromSkyColor: Color,
    toSkyColor: Color,
    fromHorizonColor: Color,
    toHorizonColor: Color,
    delta: number,
    isNight: boolean,
  ): void {
    const shader = skyboxRenderer.shader as SkyboxShader;
    shader.material.skyColor = Color.lerp(fromSkyColor, toSkyColor, delta);
    shader.material.horizonColor = Color.lerp(fromHorizonColor, toHorizonColor, delta);

    shader.useSun = this.sun.show && !isNight ? 1 : 0;
    shader.useMoon = this.moon.show && isNight ? 1 : 0;
    shader.sunSize = this.sun.sunSize.value;
    shader.sunFalloff = this.sun.sunFalloff.value;

    const normalizedDir = vec3.normalize(
      vec3.create(),
      this.transform.worldPosition,
    );
    shader._sunDirection.set(
      normalizedDir[0],
      normalizedDir[1],
      normalizedDir[2],
    );
    shader._sunColor = light.color;


    if (this.moon.show) {
      // Place the moon exactly opposite to the sun
      shader._moonDirection.set(
        -normalizedDir[0],
        -normalizedDir[1],
        -normalizedDir[2],
      );
      shader._moonPhase = this.moon.phase.value;
      shader._moonColor = Color.lerp(this.moon.color, light.color, 0.4);
    }
  }

  public override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      daySettings: {
        speed: this.daySettings.speed.toJsonObject(),
        timeOfDay: this.daySettings.timeOfDay.toJsonObject(),
      },
      sun: {
        show: this.sun.show,
        sunHeight: this.sun.sunHeight.toJsonObject(),
        sunSize: this.sun.sunSize.toJsonObject(),
        sunFalloff: this.sun.sunFalloff.toJsonObject(),
      },
      moon: {
        show: this.moon.show,
        phase: this.moon.phase.toJsonObject(),
        phaseSpeed: this.moon.phaseSpeed,
        color: this.moon.color.toJsonObject(),
      },
      shadows: {
        nightStrength: this.shadows.nightStrength.toJsonObject(),
        fadeDuration: this.shadows.fadeDuration.toJsonObject(),
      },
      hours: { ...this.hours },
      colors: {
        sunriseColor: this.colors.sunriseColor.toJsonObject(),
        noonColor: this.colors.noonColor.toJsonObject(),
        sunsetColor: this.colors.sunsetColor.toJsonObject(),
        nightColor: this.colors.nightColor.toJsonObject(),
      },
    };
  }

  public override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);

    if (jsonObject['daySettings']) {
      this.daySettings.speed.fromJson(jsonObject['daySettings'].speed);
      this.daySettings.timeOfDay.fromJson(jsonObject['daySettings'].timeOfDay);
    }
    if (jsonObject['sun']) {
      this.sun.show = jsonObject['sun'].show ?? this.sun.show;
      this.sun.sunHeight.fromJson(jsonObject['sun'].sunHeight);
      this.sun.sunSize.fromJson(jsonObject['sun'].sunSize);
      this.sun.sunFalloff.fromJson(jsonObject['sun'].sunFalloff);
    }
    if (jsonObject['moon']) {
      this.moon.show = jsonObject['moon'].show ?? this.moon.show;
      this.moon.phase.fromJson(jsonObject['moon'].phase);
      this.moon.phaseSpeed = this.moon.phaseSpeed;
      this.moon.color.fromJson(jsonObject['moon'].color);
    }
    if (jsonObject['shadows']) {
      this.shadows.nightStrength.fromJson(jsonObject['shadows'].nightStrength);
      this.shadows.fadeDuration.fromJson(jsonObject['shadows'].fadeDuration);
    }
    if (jsonObject['hours']) {
      this.hours = { ...this.hours, ...jsonObject['hours'] };
    }
    if (jsonObject['colors']) {
      this.colors.sunriseColor.fromJson(jsonObject['colors'].sunriseColor);
      this.colors.noonColor.fromJson(jsonObject['colors'].noonColor);
      this.colors.sunsetColor.fromJson(jsonObject['colors'].sunsetColor);
      this.colors.nightColor.fromJson(jsonObject['colors'].nightColor);
    }
  }
}

ObjectInstanciator.addDependency('SunBehaviour', SunBehaviour.instanciate, {
  name: 'SunBehaviour',
  type: ClassType.EntityBehaviour,
  path: 'Behaviours/SunBehaviour',
  description:
    "Controls the sun's position, color, and the day/night cycle in the scene. It simulates the sun's movement across the sky based on a time of day system, allowing for dynamic lighting changes throughout the day. The behaviour also includes an optional moon simulation that can be enabled for night scenes.",
});
