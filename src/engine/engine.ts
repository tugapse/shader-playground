import { EntityBehaviour, RendererBehaviour } from "./behaviours";
import { CameraFlyBehaviour } from "./behaviours/camera-fly-behaviour";
import { SkyboxRenderer } from "./behaviours/renderer/skybox-renderer";
import { TexturedRendererBehaviour } from "./behaviours/renderer/textured-renderer-behaviour";
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
    ObjectInstanciator.addDependency("GlEntity", (name: string, transform?: Transform) => new GlEntity(name, transform));


    ObjectInstanciator.addDependency("Camera", Camera.instanciate);
    ObjectInstanciator.addDependency("Light", Light.instanciate);
    ObjectInstanciator.addDependency("PointLight", PointLight.instanciate);
    ObjectInstanciator.addDependency("SpotLight", SpotLight.instanciate);
    ObjectInstanciator.addDependency("DirectionalLight", DirectionalLight.instanciate);
    ObjectInstanciator.addDependency("Color", () => new Color());
    ObjectInstanciator.addDependency("Transform", () => new Transform());

    // Geometry
    ObjectInstanciator.addDependency("MeshData", MeshData.instanciate);
    ObjectInstanciator.addDependency("CubePrimitive", CubePrimitive.instanciate);
    ObjectInstanciator.addDependency("QuadPrimitive", QuadPrimitive.instanciate);
    ObjectInstanciator.addDependency("SpherePrimitive", SpherePrimitive.instanciate);
    ObjectInstanciator.addDependency("SkyboxPrimitive", SkyboxPrimitive.instanciate);
    ObjectInstanciator.addDependency("TrianglePrimitive", TrianglePrimitive.instanciate);

    // Shaders
    ObjectInstanciator.addDependency("Shader", Shader.instanciate);
    ObjectInstanciator.addDependency("SkyboxShader", SkyboxShader.instanciate);
    ObjectInstanciator.addDependency("UnlitShader", UnlitShader.instanciate);
    ObjectInstanciator.addDependency("LitShader", LitShader.instanciate);

    // Behaviours (Renderers)
    ObjectInstanciator.addDependency("EntityBehaviour", EntityBehaviour.instanciate);
    ObjectInstanciator.addDependency("RendererBehaviour", RendererBehaviour.instanciate);
    ObjectInstanciator.addDependency("TexturedRendererBehaviour", TexturedRendererBehaviour.instanciate);
    ObjectInstanciator.addDependency("SkyboxRenderer", SkyboxRenderer.instanciate);

    // Materials
    ObjectInstanciator.addDependency("ColorMaterial", ColorMaterial.instanciate);
    ObjectInstanciator.addDependency("UnlitMaterial", UnlitMaterial.instanciate);
    ObjectInstanciator.addDependency("LitMaterial", LitMaterial.instanciate);
    ObjectInstanciator.addDependency("CubemapMaterial", CubemapMaterial.instanciate);

    // Other Behaviours
    ObjectInstanciator.addDependency("CameraFlyBehaviour", CameraFlyBehaviour.instanciate);

    Shader.preFetchFunctionsGlsl();
  }
}
