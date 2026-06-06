import { EntityBehaviour, MeshRendererBehaviour, RendererBehaviour } from "./behaviours";
import { CameraFlyBehaviour } from "./behaviours/camera-fly-behaviour";
import { SkyboxRenderer } from "./behaviours/renderer/skybox-renderer";
import { Keybord, Mouse, Transform } from "./core";
import { Color } from "./core/color";
import { MeshData } from "./core/mesh";
import { ObjectInstanciator } from "./core/object-instanciator";
import { Camera } from "./entities/camera";
import { GlEntity } from "./entities/entity";
import { DirectionalLight, Light, PointLight, SpotLight } from "./entities/light";
import { ColorMaterial } from "./materials/color-material";
import { CubemapMaterial } from "./materials/cubemap-material";
import { LitMaterial } from "./materials/lit-material";
import { UnlitMaterial } from "./materials/unlit-material";
import { CubePrimitive } from "./primitives/cube-primitive";
import { QuadPrimitive } from "./primitives/quad-primitive";
import { SkyboxPrimitive } from "./primitives/skybox-primitive";
import { SpherePrimitive } from "./primitives/sphere-primitive";
import { TrianglePrimitive } from "./primitives/triangle-primitive";
import { LitShader } from "./shaders/lit-shader";
import { Shader } from "./shaders/shader";
import { SkyboxShader } from "./shaders/skybox-shader";
import { UnlitShader } from "./shaders/unlit-shader";
import { ClassType } from "./enums/class-type.enum";

/**
  The main entry point for the engine. This class handles the initialization of core components and dependency registration.
 */
export class Engine {

  private canvas!: HTMLCanvasElement;
  public isFocused: boolean = false;
  public isTabActive: boolean = true;
  public isWindowFocused: boolean = true;

  /**
    Initializes the engine by registering all core dependencies.

   * @returns {void}
   */
  public initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.canvas.tabIndex = 0; // Make canvas focusable
    this.initializeEvents();
    this.registerDependencies();
  }

  private initializeEvents() {
    // Canvas-specific event listeners
    this.canvas.addEventListener('contextmenu', this.onEngineContextMenu);
    this.canvas.addEventListener('keydown', this.onEngineKeyDown);
    this.canvas.addEventListener('keyup', this.onEngineKeyUp);
    this.canvas.addEventListener('mousemove', this.onEngineMouseMove);
    this.canvas.addEventListener('mousedown', this.onEngineMouseDown);
    this.canvas.addEventListener('mouseup', this.onEngineMouseUp);
    this.canvas.addEventListener('mouseleave', this.onEngineMouseLeave);
    this.canvas.addEventListener('focus', this.onEngineFocus);
    this.canvas.addEventListener('blur', this.onEngineBlur);
    this.canvas.addEventListener('wheel', this.onEngineMouseScroll);

    // Global event listeners
    document.addEventListener('visibilitychange', this.onEngineVisibilityChange);
    window.addEventListener('focus', this.onEngineWindowFocus);
    window.addEventListener('blur', this.onEngineWindowBlur);
  }

  private onEngineContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  }

  private onEngineKeyDown = (event: KeyboardEvent): void => {
    Keybord.keyDown[event.key.toLowerCase()] = true;
  }

  private onEngineKeyUp = (event: KeyboardEvent): void => {
    if (Keybord.keyDown[event.key.toLowerCase()]) {
      Keybord.keyUp[event.key.toLowerCase()] = true;
      Keybord.keyPress[event.key.toLowerCase()] = true;
    }
    Keybord.keyDown[event.key.toLowerCase()] = false;
  }

  private onEngineMouseMove = (event: MouseEvent): void => {
    const canvasRect = this.canvas.getBoundingClientRect();
    Mouse.mousePosition.x = Math.max(event.clientX - canvasRect.x, 0);
    Mouse.mousePosition.y = Math.max(event.clientY - canvasRect.y, 0);
    Mouse.mouseMovement.x = event.movementX;
    Mouse.mouseMovement.y = event.movementY;
  }

  private onEngineMouseDown = (event: MouseEvent): void => {
    if (this.isFocused) {
      event.preventDefault();
    }
    Mouse.mouseButtonDown[event.button] = true;
  }

  private onEngineMouseUp = (event: MouseEvent): void => {
    Mouse.mouseButtonDown[event.button] = false;
  }

  private onEngineMouseLeave = (): void => {
    for (const buttonIndex in Mouse.mouseButtonDown) {
      if (Mouse.mouseButtonDown[buttonIndex]) {
        Mouse.mouseButtonDown[buttonIndex] = false;
      }
    }
  }

  private onEngineFocus = (): void => {
    this.isFocused = true;
  }

  private onEngineBlur = (): void => {
    this.isFocused = false;
  }

  private onEngineMouseScroll = (event: WheelEvent): void => {
    if (!this.isFocused) return;
    Mouse.wheelY = event.deltaY;
    Mouse.wheelX = event.deltaX;
  }

  private onEngineVisibilityChange = (): void => {
    this.isTabActive = !document.hidden;
  }

  private onEngineWindowFocus = (): void => {
    this.isWindowFocused = true;
  }

  private onEngineWindowBlur = (): void => {
    this.isWindowFocused = false;
  }

  /**
    Registers all necessary classes and their instantiation methods with the SceneManager's dependency injection system.
   * @private

   * @returns {void}
   */
  private registerDependencies(): void {
    // Entities
    ObjectInstanciator.addDependency("GlEntity", (name: string, transform?: Transform) => new GlEntity(name, transform), {
      name: "GlEntity",
      type: ClassType.Entity,
      path: "Entities/GlEntity",
      description: "Base class for all entities in the scene."
    });

    ObjectInstanciator.addDependency("Camera", Camera.instanciate, {
      name: "Camera",
      type: ClassType.Entity,
      path: "Entities/Camera",
      description: "Represents a camera in the 3D scene, generating view and projection matrices."
    });

    ObjectInstanciator.addDependency("Light", Light.instanciate, {
      name: "Light",
      type: ClassType.Light,
      path: "Entities/Light",
      description: "Base class for all light sources in the scene."
    });

    ObjectInstanciator.addDependency("PointLight", PointLight.instanciate, {
      name: "PointLight",
      type: ClassType.Light,
      path: "Entities/Light",
      description: "A light source that emits light in all directions from a single point."
    });

    ObjectInstanciator.addDependency("SpotLight", SpotLight.instanciate, {
      name: "SpotLight",
      type: ClassType.Light,
      path: "Entities/Light",
      description: "A light source that casts a cone of light in a specific direction."
    });

    ObjectInstanciator.addDependency("DirectionalLight", DirectionalLight.instanciate, {
      name: "DirectionalLight",
      type: ClassType.Light,
      path: "Entities/Light",
      description: "A directional light source simulating light from a distant source like the sun."
    });

    ObjectInstanciator.addDependency("Color", () => new Color());
    ObjectInstanciator.addDependency("Transform", () => new Transform(), {
      name: "Transform",
      type: ClassType.Transform,
      path: "Core/Transform",
      description: "Represents the position, rotation, and scale of an object in 3D space."
    });

    // Geometry
    ObjectInstanciator.addDependency("MeshData", MeshData.instanciate, {
      name: "MeshData",
      type: ClassType.Mesh,
      path: "Geometry/MeshData",
      description: "Base class for geometric mesh data holding vertices, normals, and UVs."
    });
    ObjectInstanciator.addDependency("CubePrimitive", CubePrimitive.instanciate, {
      name: "CubePrimitive",
      type: ClassType.Mesh,
      path: "Geometry/Primitives/Cube",
      description: "A primitive mesh representing a 3D cube."
    });
    ObjectInstanciator.addDependency("QuadPrimitive", QuadPrimitive.instanciate, {
      name: "QuadPrimitive",
      type: ClassType.Mesh,
      path: "Geometry/Primitives/Quad",
      description: "A primitive mesh representing a 2D quad/plane."
    });
    ObjectInstanciator.addDependency("SpherePrimitive", SpherePrimitive.instanciate, {
      name: "SpherePrimitive",
      type: ClassType.Mesh,
      path: "Geometry/Primitives/Sphere",
      description: "A primitive mesh representing a 3D sphere."
    });
    ObjectInstanciator.addDependency("SkyboxPrimitive", SkyboxPrimitive.instanciate, {
      name: "SkyboxPrimitive",
      type: ClassType.Mesh,
      path: "Geometry/Primitives/Skybox",
      description: "A primitive mesh specifically structured for skyboxes."
    });
    ObjectInstanciator.addDependency("TrianglePrimitive", TrianglePrimitive.instanciate, {
      name: "TrianglePrimitive",
      type: ClassType.Mesh,
      path: "Geometry/Primitives/Triangle",
      description: "A primitive mesh representing a simple 2D triangle."
    });

    // Shaders
    ObjectInstanciator.addDependency("Shader", Shader.instanciate, {
      name: "Shader",
      type: ClassType.Shader,
      path: "Shaders/Shader",
      description: "Base class managing the creation and compilation of WebGL shader programs."
    });
    ObjectInstanciator.addDependency("SkyboxShader", SkyboxShader.instanciate, {
      name: "SkyboxShader",
      type: ClassType.Shader,
      path: "Shaders/Skybox",
      description: "A specialized shader for rendering cubemap skyboxes."
    });
    ObjectInstanciator.addDependency("UnlitShader", UnlitShader.instanciate, {
      name: "UnlitShader",
      type: ClassType.Shader,
      path: "Shaders/Unlit",
      description: "A shader for rendering unlit materials not affected by scene lights."
    });
    ObjectInstanciator.addDependency("LitShader", LitShader.instanciate, {
      name: "LitShader",
      type: ClassType.Shader,
      path: "Shaders/Lit",
      description: "A shader for rendering objects with lighting and normal mapping, implementing the Phong lighting model."
    });

    // Behaviours (Renderers)
    ObjectInstanciator.addDependency("EntityBehaviour", EntityBehaviour.instanciate, {
      name: "EntityBehaviour",
      type: ClassType.EntityBehaviour,
      path: "Behaviours/EntityBehaviour",
      description: "Base class for all entity behaviours."
    });
    ObjectInstanciator.addDependency("RendererBehaviour", RendererBehaviour.instanciate, {
      name: "RendererBehaviour",
      type: ClassType.RenderBehaviour,
      path: "Behaviours/Renderers/RendererBehaviour",
      description: "Base class for all rendering behaviours."
    });
    ObjectInstanciator.addDependency("MeshRendererBehaviour", MeshRendererBehaviour.instanciate, {
      name: "MeshRendererBehaviour",
      type: ClassType.RenderBehaviour,
      path: "Behaviours/Renderers/MeshRendererBehaviour",
      description: "Renders 3D meshes using the assigned material and shader."
    });
    ObjectInstanciator.addDependency("SkyboxRenderer", SkyboxRenderer.instanciate, {
      name: "SkyboxRenderer",
      type: ClassType.RenderBehaviour,
      path: "Behaviours/Renderers/SkyboxRenderer",
      description: "A specialized renderer for drawing a skybox background."
    });

    // Materials
    ObjectInstanciator.addDependency("ColorMaterial", ColorMaterial.instanciate, {
      name: "ColorMaterial",
      type: ClassType.Material,
      path: "Materials/Color",
      description: "A basic material representing a solid color."
    });
    ObjectInstanciator.addDependency("UnlitMaterial", UnlitMaterial.instanciate, {
      name: "UnlitMaterial",
      type: ClassType.Material,
      path: "Materials/Unlit",
      description: "A material used for unlit shaders, ignoring scene lighting."
    });
    ObjectInstanciator.addDependency("LitMaterial", LitMaterial.instanciate, {
      name: "LitMaterial",
      type: ClassType.Material,
      path: "Materials/Lit",
      description: "A material supporting physical lighting properties like roughness, specular strength, and normal mapping."
    });
    ObjectInstanciator.addDependency("CubemapMaterial", CubemapMaterial.instanciate, {
      name: "CubemapMaterial",
      type: ClassType.Material,
      path: "Materials/Cubemap",
      description: "A material used specifically for skyboxes and reflections, mapping a cubemap texture."
    });

    // Other Behaviours
    ObjectInstanciator.addDependency("CameraFlyBehaviour", CameraFlyBehaviour.instanciate, {
      name: "CameraFlyBehaviour",
      type: ClassType.EntityBehaviour,
      path: "Behaviours/CameraFlyBehaviour",
      description: "A free-look camera controller allowing movement and rotation via keyboard and mouse."
    });

    Shader.preFetchFunctionsGlsl();
  }
}
