import { DependencyManager, InputManager } from './managers';

/**
  The main entry point for the engine. This class handles the initialization of core components and dependency registration.
 */
export class Engine {
  public isFocused: boolean = false;
  public isTabActive: boolean = true;
  public isWindowFocused: boolean = true;

  private inputManager!: InputManager;
  private dependencyManager!: DependencyManager;

  /**
    Initializes the engine by registering all core dependencies.

   * @returns {void}
   */
  public initialize(canvas: HTMLCanvasElement): void {
    this.inputManager = new InputManager(this, canvas);
    this.dependencyManager = new DependencyManager();

    this.inputManager.initialize();
    this.dependencyManager.registerDependencies();
  }
}
