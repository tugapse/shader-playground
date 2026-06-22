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
  protected moonLight: DirectionalLight | undefined;

  /** Settings related to the passage of time in the day/night cycle. */
  public dayCycleSettings = {
    /** The speed multiplier for the time of day progression. */
    speed: new NumberRange(0, 0, 100, 1),
    /** The current time of day, from 0 (midnight) to 24 (next midnight). */
    timeOfDay: new NumberRange(11, 0, 24.01, 0.5),
  };
  /** Key time points in the 24-hour day cycle. */
  public hours = {
    sunrise: 6.0, // 6:00 AM
    noon: 12.0, // 12:00 PM
    sunset: 18.5, // 6:30 PM
    night: 20.0, // 8:00 PM
  };

  /** Color palette for the day/night cycle. */
  public lighColor = {
    sunriseColor: new Color(255 / 255, 190 / 255, 120 / 255, 1.0),
    noonColor: new Color(255 / 255, 250 / 255, 245 / 255, 1.0),
    sunsetColor: new Color(255 / 255, 150 / 255, 80 / 255, 1.0),
    nightColor: new Color(30 / 255, 40 / 255, 60 / 255, 1.0),
  };

  public dayPhaseColors = {
    sunriseSkyColor: new Color(0.43, 0.47, 0.57, 1.0),
    sunriseHorizonColor: new Color(0.34, 0.35, 0.35, 1.0),
    noonSkyColor: new Color(0.53, 0.81, 0.92, 1.0),
    noonHorizonColor: new Color(0.86, 0.92, 0.98, 1.0),
    sunsetSkyColor: new Color(0.19, 0.21, 0.34, 1.0),
    sunsetHorizonColor: new Color(0.32, 0.29, 0.28, 1.0),
    nightSkyColor: new Color(0.04, 0.06, 0.12, 1.0),
    nightHorizonColor: new Color(0.08, 0.12, 0.2, 1.0),
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
    /** The speed at which the moon's phase changes. */
    phaseSpeed: 0.0005,
    /** The base color of the moon. */
    color: new Color(0.85, 0.9, 0.95, 1.0), // Pale, cool white
    /** The current phase of the moon, from 0 (new moon) to 1 (new moon again). */
    phase: new NumberRange(0, 0, 1.01, 0.01),
    /** Uses a directional light a moon light, if not present it creates one at runtime */
    useDirectionalLight: false,
    /** Brightness of the moon's dark side (from reflected light). */
    earthshine: new NumberRange(0.02, 0, 0.4, 0.001),
    /** Softness of the shadow transition on the moon's surface. */
    terminatorSoftness: new NumberRange(0.5, 0.01, 1, 0.01),
    /** Enables the rotation of the moon's surface texture. */
    enableRotation: true,
    /** The speed at which the moon's surface texture rotates. */
    rotationSpeed: new NumberRange(0.05, 0, 0.5, 0.001),
  };

  /** Settings for shadow appearance during the day/night cycle. */
  public shadows = {
    /** The strength of shadows at night (e.g., from the moon). */
    nightStrength: new NumberRange(0.2, 0, 1, 0.01),
    /** The strength of shadows during the day (e.g., from the sun). */
    dayStrength: new NumberRange(0.5, 0, 1, 0.01),
    /** The duration of the shadow fade-in/out transition in hours (e.g., 0.5 for 30 minutes). */
    fadeDuration: new NumberRange(1.2, 0, 2, 0.1),
  };

  public clouds = {
    /** Toggles the visibility of clouds in the skybox. */
    show: true,
    /** The speed at which clouds drift across the sky. */
    speed: new NumberRange(0.01, 0.001, 0.5, 0.000001),
    /** The tiling/scale of the cloud noise. Higher values make clouds smaller and more repetitive. */
    tiling: new NumberRange(0.05, 0.0001, 2, 0.000001),

    /** The sparsity of clouds. Higher values make clouds more sparse and scattered. */
    sparsity: new NumberRange(0.01, 0, 1, 0.000001),
    /** The overall weather condition, from clear (0) to stormy (1). */
    weather: new NumberRange(0.4, 0, 1, 0.000001),
    /** The number of tmer to loop the noise */
    repetition: new NumberRange(1, 0, 10, 1),
  };

  public stars = {
    show: true,
    /** The overall brightness of the stars. */
    intensity: new NumberRange(3.0, 0, 20, 0.1),
    /** Size/frequency of star cells. Higher values result in smaller, more numerous stars. */
    scale: new NumberRange(200.0, 10, 500, 1),
    /** The density of stars. Higher values mean fewer stars are visible. */
    sparsity: new NumberRange(34.0, 10, 100, 1),
    /** The rotational speed of the starfield. */
    speed: new NumberRange(0.0004, 0, 0.02, 0.0001),
  };

  override initialize(): boolean {
    if (!this.parent?.scene) return false;
    this._serializationIgnoreKeys.push('moonLight');
    this._skyboxRenderer = this.parent.scene?.objects
      .find((o: GlEntity) => o.getBehaviour(SkyboxRenderer))
      ?.getBehaviour(SkyboxRenderer);
    this.update(0);
    return super.initialize();
  }

  public override update(elapsed: number): void {
    if (!this.parent?.scene) return;
    super.update(elapsed);

    this.updateTime(elapsed);
    const light = this.parent as DirectionalLight;

    if (!light || light.entityType !== EntityType.LIGHT_DIRECTIONAL) {
      return;
    }
    this.updateOrCreateMoonLinght();
    this.updateSunPosition(light, this.moonLight);
    this.updateLightColor(light, this.moonLight);
  }

  private creaMoonLight(moonLight: DirectionalLight) {
    moonLight = new DirectionalLight('MoonLight');
    moonLight.tag = 'MoonLight';
    moonLight.transform.setParent(this.transform);
    this.parent.scene.addEntity(moonLight);
    this.moonLight = moonLight; // Cache for next frame
    return moonLight;
  }

  updateOrCreateMoonLinght() {
    this.moonLight =
      this.moonLight ||
      (this.parent.scene.lights.find(
        (o) => o.tag === 'MoonLight',
      ) as DirectionalLight);

    // Manage moon light's existence and state based on editor settings.
    if (this.moon.useDirectionalLight) {
      if(! this.parent.scene.isRunning)
        return
      if (!this.moonLight) {
        this.moonLight = this.creaMoonLight(this.moonLight); // Cache for next frame
      }
      // Ensure the light is active and has the correct color when enabled.
      this.moonLight.active = true;
      this.moonLight.color = this.lighColor.nightColor;
    } else if (this.moonLight) {
      // If the option is disabled, ensure the light is inactive.
      this.moonLight.active = false;
    }

  }

  /**
   * Updates the time of day and moon phase based on the elapsed time.
   * The time of day loops between 0 and 24, and the moon phase loops between 0 and 1.
   * @param elapsed The time in seconds since the last frame.
   */
  private updateTime(elapsed: number): void {
    if (this.parent?.scene?.isRunning) {
      this.dayCycleSettings.timeOfDay.value +=
        elapsed * this.dayCycleSettings.speed.value * 0.01;

      if (this.dayCycleSettings.timeOfDay.value >= 24.0) {
        this.dayCycleSettings.timeOfDay.value -= 24.0;
      }
      if (this.dayCycleSettings.timeOfDay.value < 0.0) {
        this.dayCycleSettings.timeOfDay.value += 24.0;
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
  private updateSunPosition(
    light: DirectionalLight | undefined,
    moonLight: DirectionalLight | undefined,
  ): void {
    if (!light) return;
    const sunDistance = 1.0;
    const tiltAngle = Math.acos(this.sun.sunHeight.value);

    // Convert time of day to an angle for the sun's circular path.
    // The -0.25 offset places noon (0.5) at the top of the arc (Math.PI / 2).
    const dailyAngle =
      (this.dayCycleSettings.timeOfDay.value / 24.0 - 0.25) * Math.PI * 2;
    const x2d = Math.cos(dailyAngle) * sunDistance;
    const y2d = Math.sin(dailyAngle) * sunDistance;

    // Rotate the 2D position around the X-axis to apply the tilt, creating a 3D arc.
    const x = x2d;
    const y = y2d * Math.cos(tiltAngle);
    const z = -y2d * Math.sin(tiltAngle);

    light.transform.setWorldPosition(x, y, z);
    light.transform.lookAt(new Vector3(0, 0, 0));

    if (moonLight) {
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
    const time = this.dayCycleSettings.timeOfDay.value;
    const { sunrise, noon, sunset, night } = this.hours;
    const { sunriseColor, noonColor, sunsetColor, nightColor } = this.lighColor;
    const {
      sunriseSkyColor,
      sunriseHorizonColor,
      noonSkyColor,
      noonHorizonColor,
      sunsetSkyColor,
      sunsetHorizonColor,
      nightSkyColor,
      nightHorizonColor,
    } = this.dayPhaseColors;

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
  private updateLightColor(
    light: DirectionalLight | undefined,
    moonLight: DirectionalLight | undefined,
  ): void {
    if (!light) return;

    const time = this.dayCycleSettings.timeOfDay.value;
    const { sunrise, sunset, night } = this.hours;

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

    // Set the light's RGB color by interpolating.
    light.color = Color.lerp(fromLightColor, toLightColor, clampedDelta);

    const fadeDuration = 0.5; // 30 minutes for fade in/out
    let sunAlpha = 1.0;

    // Fade out before sunset
    if (time >= sunset - fadeDuration && time <= sunset) {
      const fadeProgress = (time - (sunset - fadeDuration)) / fadeDuration;
      sunAlpha = 1.0 - smoothstep(fadeProgress);
    }
    // Fade in before sunrise
    else if (time >= sunrise - fadeDuration && time <= sunrise) {
      const fadeProgress = (time - (sunrise - fadeDuration)) / fadeDuration;
      sunAlpha = smoothstep(fadeProgress);
    }
    // Sun is down
    else if (time > sunset || time < sunrise - fadeDuration) {
      sunAlpha = 0.0;
    }

    if (moonLight) {
      // Two-light setup: Sun and Moon are separate lights.
      // Control their strengths (alpha) independently based on time of day.

      moonLight.color = this.lighColor.nightColor.clone();
      const transitionDelta = smoothstep(clampedDelta);

      if (time >= sunrise && time < sunset) {
        // Daytime: Sun is controlled by sunAlpha, moon is off.
        light.color.a = sunAlpha;
        moonLight.color.a = 0.0;
      } else if (time >= sunset && time < night) {
        // Sunset to Night: Fade out sun, fade in moon.
        light.color.a = sunAlpha;
        moonLight.color.a = transitionDelta * this.lighColor.nightColor.a;
      } else {
        // Night to Sunrise: Fade in sun, fade out moon.
        light.color.a = sunAlpha;
        moonLight.color.a =
          (1.0 - transitionDelta) * this.lighColor.nightColor.a;
      }
    } else {
      // If there's no moon light, just apply the sun alpha
      light.color.a = sunAlpha;
    }

    const shadowRenderer = this.parent.scene.shadowmap;
    if (shadowRenderer) {
      shadowRenderer.shadowstrength.value = this._calculateShadowStrength(
        time,
        this.shadows.dayStrength.value,
      );
    }
    this.updateSceneColors(light.color);

    if (time > this.hours.night - 0.5 && time < this.hours.night) {
      // ex if time is 15.54 it should show all the light streagth
      // if time is 15.98 it should almost fade with 0.0.0.1
    }
    // For skybox visuals, we switch between sun and moon at the actual sunset/sunrise times.
    const isSunDown = time < this.hours.sunrise || time > this.hours.sunset;
    // light.invertLightDirection = isSunDown;

    this.updateSkybox(
      light,
      fromSkyColor,
      toSkyColor,
      fromHorizonColor,
      toHorizonColor,
      clampedDelta,
      isSunDown,
    );
  }

  /**
   * Calculates the appropriate shadow strength based on the time of day.
   * @param time The current time of day (0-24).
   * @param maxDayStrength The maximum shadow strength during the day.
   * @returns The calculated shadow strength (0-1).
   */
  private _calculateShadowStrength(
    time: number,
    maxDayStrength: number,
  ): number {
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
      const progress =
        (time - sunsetFadeStart) / (this.hours.sunset - sunsetFadeStart);
      shadowStrength = (1 - smoothstep(progress)) * dayStrength;
    } else if (time >= this.hours.sunset && time < nightFadeEnd) {
      // Fading in night shadow
      const progress =
        (time - this.hours.sunset) / (nightFadeEnd - this.hours.sunset);
      shadowStrength = smoothstep(progress) * nightStrength;
    } else if (time >= sunriseFadeStart && time < this.hours.sunrise) {
      // Fading out night shadow
      const progress =
        (time - sunriseFadeStart) / (this.hours.sunrise - sunriseFadeStart);
      shadowStrength = (1 - smoothstep(progress)) * nightStrength;
    } else if (time >= this.hours.sunrise && time < sunriseFadeEnd) {
      // Fading in day shadow
      const progress =
        (time - this.hours.sunrise) / (sunriseFadeEnd - this.hours.sunrise);
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
      scene.sceneFog.color = color;
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
    isSunDown: boolean,
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
        this._skyboxRenderer,
        light,
        fromSkyColor,
        toSkyColor,
        fromHorizonColor,
        toHorizonColor,
        delta,
        isSunDown,
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
    isSunDown: boolean,
  ): void {
    const shader = skyboxRenderer.shader as SkyboxShader;
    shader.material.skyColor = Color.lerp(fromSkyColor, toSkyColor, delta);
    shader.material.horizonColor = Color.lerp(
      fromHorizonColor,
      toHorizonColor,
      delta,
    );
    this.parent.scene.sceneFog.color = shader.material.horizonColor;

    shader.useSun = this.sun.show && !isSunDown ;
    shader.useMoon = this.moon.show && isSunDown ;
    shader.sunSize = this.sun.sunSize.value;
    shader.sunFalloff = this.sun.sunFalloff.value;

    const normalizedDir = vec3.normalize(
      vec3.create(),
      this.transform.worldPosition,
    );
    shader.sunDirection.set(
      normalizedDir[0],
      normalizedDir[1],
      normalizedDir[2],
    );
    shader.sunColor = light.color;

    if (this.moon.show) {
      // Place the moon exactly opposite to the sun
      shader.moonDirection.set(
        -normalizedDir[0],
        -normalizedDir[1],
        -normalizedDir[2],
      );
      shader.moonPhase = this.moon.phase.value;
      shader.moonColor = Color.lerp(this.moon.color, light.color, 0.4);
      shader.moonEarthshine = this.moon.earthshine.value;
      shader.moonTerminatorSoftness = this.moon.terminatorSoftness.value;
      shader.moonEnableRotation = this.moon.enableRotation ? 1 : 0;
      shader.moonRotationSpeed = this.moon.rotationSpeed.value;
    }

    shader.useClouds = this.clouds.show;
    if (this.clouds.show) {
      shader.cloudSpeed = this.clouds.speed.value;
      shader.cloudTiling = this.clouds.tiling.value;
      shader.cloudSparsity = this.clouds.sparsity.value;
      shader.cloudRepetition = this.clouds.repetition.value;
      shader.wheatherCondition = this.clouds.weather.value;
    }
    shader.useStars = this.stars.show;
    if (this.stars.show) {
      shader.starIntensity = this.stars.intensity.value;
      shader.starScale = this.stars.scale.value;
      shader.starSparsity = this.stars.sparsity.value;
      shader.starSpeed = this.stars.speed.value;
    }
  }

  public override toJsonObject(): JsonSerializedData {
    return this.serializeAutomatically();
  }

  public override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.deserializeAutomatically(jsonObject);
  }
}

ObjectInstanciator.addDependency('SunBehaviour', SunBehaviour.instanciate, {
  name: 'SunBehaviour',
  type: ClassType.EntityBehaviour,
  path: 'Behaviours/SunBehaviour',
  description:
    "Controls the sun's position, color, and the day/night cycle in the scene. It simulates the sun's movement across the sky based on a time of day system, allowing for dynamic lighting changes throughout the day. The behaviour also includes an optional moon simulation that can be enabled for night scenes.",
});
