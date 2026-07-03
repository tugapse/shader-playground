import { Scene } from './entities';
import { DependencyManager, EngineEventManager } from './managers';

/**
  The main entry point for the engine. This class handles the initialization of core components and dependency registration.
 */
export class Engine {
  public isFocused: boolean = false;
  public isTabActive: boolean = true;
  public isWindowFocused: boolean = true;

  private eventManager!: EngineEventManager;
  private dependencyManager!: DependencyManager;
  private scene!: Scene;

  public get currentScene(): Scene {
    return this.scene;
  }

  /**
    Initializes the engine by registering all core dependencies.

   * @returns {void}
   */
  public initialize(canvas: HTMLCanvasElement): void {
    this.eventManager = new EngineEventManager(this, canvas);
    this.dependencyManager = new DependencyManager();

    this.eventManager.initialize();
    this.dependencyManager.registerDependencies();
  }

  public loadScene(scene: Scene): void {
    this.scene = scene;
    this.scene.initialize();
  }

  public update(deltaTime: number): void {
    this.scene?.update(deltaTime);
  }

  public render(): void {
    this.scene?.draw();
  }

  public destroy(): void {
    this.scene?.destroy();
  }

  public handleFocusChange(isFocused: boolean): void {
    this.isFocused = isFocused;
    this.isTabActive = document.visibilityState === 'visible';
    this.isWindowFocused = isFocused;
  }
}
