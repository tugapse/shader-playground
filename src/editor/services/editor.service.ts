import { EventEmitter, inject, Injectable } from '@angular/core';
import {
  Camera,
  CameraFlyBehaviour,
  CanvasViewport,
  Engine,
  Scene,
} from 'omega-game-engine';
import { BehaviorSubject } from 'rxjs';
import { GizmoMode } from '../behaviours/scene-editor/gizmo-mode.enum';
import { TransformSpace } from '../behaviours/scene-editor/transform-space.enum';
import { EditorStateService } from './editor-state.service';
import { API_URL } from 'src/app/api/api-url.token';

@Injectable({ providedIn: 'root' })
export class EditorService {
  private _gameEngine!: Engine | null;
  private editorStateService: EditorStateService = inject(EditorStateService);
  apiUrl = inject(API_URL);

  public onSceneLoaded = new EventEmitter<Scene>();
  public onScenePlay = new EventEmitter<Scene>();
  public onScenePause = new EventEmitter<Scene>();
  public onSceneStop = new EventEmitter<Scene>();
  public onSceneUpdated = new EventEmitter<Scene>();
  public onEditorSaveStateRequest = new EventEmitter();
  public editorRunningState = new EventEmitter<boolean>();

  public onRenderingContextCreated = new EventEmitter<WebGL2RenderingContext>();
  public onCanvasRequestResize = new BehaviorSubject<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  public onCanvasRequestReset = new EventEmitter();

  public onRenderFrame = new BehaviorSubject<WebGL2RenderingContext | null>(
    null,
  );
  public onUpdateFrame = new BehaviorSubject<number>(0);

  public gizmoMode = new BehaviorSubject<GizmoMode>(GizmoMode.Translate);
  public transformSpace = new BehaviorSubject<TransformSpace>(
    TransformSpace.Local,
  );
  private _canvas!: HTMLCanvasElement | null;
  public setCanvas(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
  }

  private _gl!: WebGL2RenderingContext;

  public get scene(): Scene {
    return this.currentScene;
  }

  public get camera(): Camera {
    return this._camera;
  }

  public get gl(): WebGL2RenderingContext {
    return this._gl;
  }

  public get gameEngine(): Engine | null {
    if (!this._gameEngine) {
      this._gameEngine = new Engine();
    }
    return this._gameEngine;
  }

  private currentScene!: Scene;
  private _camera!: Camera;
  constructor() {
    this.initializeEditorCamera();
    this.onRenderingContextCreated.subscribe(
      this.onGlContextCreated.bind(this),
    );
  }

  onGlContextCreated(gl: WebGL2RenderingContext) {
    console.log('onGlContextCreated');
    this._gl = gl;
  }

  loadScene(scene: Scene) {
    this.currentScene = scene;
    this.onSceneLoaded.emit(scene);
  }

  requestCanvasResize() {
    this.onCanvasRequestResize.next({
      width: CanvasViewport.rendererWidth,
      height: CanvasViewport.rendererHeight,
    });
  }

  requestScenePlay(scene?: Scene) {
    this.onScenePlay.emit(scene);
  }

  requestScenePause(scene?: Scene) {
    this.onScenePause.emit(scene);
  }

  requestSceneStop(scene?: Scene) {
    this.onSceneStop.emit(scene);
  }

  public setGizmoMode(mode: GizmoMode) {
    this.gizmoMode.next(mode);
  }

  public setTransformSpace(space: TransformSpace) {
    this.transformSpace.next(space);
  }

  public setToggleWorkspacePanel(
    panel: 'left' | 'right' | 'footer',
    visible: boolean,
  ) {}

  protected initializeEditorCamera() {
    this._camera = new Camera();
    this._camera.name = 'Editor Camera';
    this._camera.fieldOfView = 65;
    this._camera.transform.translate(2, 3, 10);
    this._camera.transform.rotate(0, 180, 0);
    this._camera.initialize();
    this._camera.addBehaviour(new CameraFlyBehaviour());
    Camera.setMainCamera(this._camera);
    this._camera.updateInEditor = true;
  }

  public async reloadEngineRuntime(): Promise<Engine | null> {
    const project = this.editorStateService.activeProject();
    if (!project?.id) {
      if (this._gameEngine) {
        this._gameEngine.destroy();
        this._gameEngine = null;
      }
      return null;
    }

    if (this._gameEngine) {
      this._gameEngine.destroy();
      this._gameEngine = null;
    }

    const baseGateway = this.apiUrl.endsWith('/api')
      ? this.apiUrl
      : `${this.apiUrl}/api`;

    // 🎯 Extract token from storage (Adjust keys depending on where your AuthService writes it)
    const authToken =
      localStorage.getItem('omega-auth-token') ||
      sessionStorage.getItem('token') ||
      '';
    debugger;

    // 🎯 Append token directly into query segment so browser import shares it with backend
    const bundleUrl = `${baseGateway}/projects/${project.id}/code/bundle?token=${encodeURIComponent(authToken)}&t=${new Date().getTime()}`;

    try {
      const gameModule = await import(/* @vite-ignore */ bundleUrl);

      if (!gameModule.Game) {
        console.error(
          "Linker error: The module loaded, but failed to locate an exported 'Game' class.",
        );
        return null;
      }

      this._gameEngine = new gameModule.Game();
      if (this._gameEngine && this._gameEngine instanceof Engine) {
        this._gameEngine.registerDependencies();
        console.log(
          `🚀 Successfully loaded and booted engine instance for project: ${project.id}`,
        );
        return this._gameEngine;
      } else {
        console.error(
          `Linker error: The module loaded, but the exported 'Game' class is not an instance of Engine.`,
        );
        return null;
      }
    } catch (error) {
      console.error(
        `CRITICAL: Dynamic runtime execution injection fault for project ${project.id}:`,
        error,
      );
      return null;
    }
  }
}
