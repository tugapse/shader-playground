import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  Renderer2,
  ViewChild,
} from "@angular/core";
import { GizmoMode } from "@editor/behaviours/scene-editor/gizmo-mode.enum";
import { TransformSpace } from "@editor/behaviours/scene-editor/transform-space.enum";
import { EditorService } from "@editor/services/editor.service";
import { EditorSettingsService } from "@editor/services/editor.settings";
import {
  Camera,
  CanvasViewport,
  cleanLastFrame,
  Colors,
  Engine,
  Scene,
} from "omega-game-engine";
import { fromEvent, Subject } from "rxjs";
import { debounceTime, takeUntil } from "rxjs/operators";
import { Icon } from "src/app/components/icon/icon";

export interface EngineStats {
  fps: number;
  frameTimeMs: number;
  updateTimeMs: number;
  renderTimeMs: number;
  browserTimeMs: number;
}

@Component({
  selector: "editor-canvas",
  imports: [Icon],
  templateUrl: "./canvas.html",
  styleUrl: "./canvas.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Canvas implements OnDestroy, AfterViewInit {
  @Output() onGlContextCreated = new EventEmitter<WebGL2RenderingContext>();
  @Output() stats = new EventEmitter<EngineStats>();

  @ViewChild("glCanvas") private glCanvas!: ElementRef<HTMLCanvasElement>;

  public gl!: WebGL2RenderingContext | null;

  private canvasElement!: HTMLCanvasElement;
  private lastTime = 0;
  private lastDrawTime = 0;
  private lastFpsUpdateTime = 0;
  private frameCount = 0;
  private animationFrameId: number | null = null;

  private accumulatedFrameTime = 0;
  private accumulatedUpdateTime = 0;
  private accumulatedRenderTime = 0;

  private lastRafEndTime = 0;
  private accumulatedBrowserTime = 0;
  private rafCount = 0;

  private readonly targetFps = 60;
  private readonly frameInterval = 1000 / this.targetFps;
  private destroy$ = new Subject<void>();
  private defaultClearColor = Colors.brown;

  public gizmoMode: GizmoMode = GizmoMode.Translate;
  public GizmoMode = GizmoMode;

  public transformSpace: TransformSpace = TransformSpace.Local;
  public TransformSpace = TransformSpace;

  constructor(
    private editorService: EditorService,
    private editorSettings: EditorSettingsService,
    private ngZone: NgZone,
    private renderer: Renderer2,
  ) {
    this.editorService.onCanvasRequestResize
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.resizeCanvas(true));

    this.editorService.onCanvasRequestReset
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.disposeWebGL();
        this.initWebGL();
      });

    this.editorService.gizmoMode.subscribe((mode) => {
      this.gizmoMode = mode;
    });

    this.editorService.transformSpace.subscribe((space) => {
      this.transformSpace = space;
    });
  }

  ngAfterViewInit(): void {
    this.initWebGL();
    try {
      this.editorService.gameEngine?.initialize(this.canvasElement);
    } catch (error) {
      console.error("Error initializing engine:", error);
    }
    this.setupWindowEvents();

    this.ngZone.runOutsideAngular(() => {
      this.animationFrameId = requestAnimationFrame(this.render.bind(this));
    });
    this.resizeCanvas();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.editorService.gameEngine?.destroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  public shouldRender(): boolean {
    return (
      !!this.editorService.gameEngine?.isTabActive &&
      !!this.editorService.gameEngine?.isWindowFocused
    );
  }

  public render(timestamp: number): void {
    this.trackBrowserOverhead();

    if (!this.lastTime) this.lastTime = timestamp;
    if (!this.lastDrawTime) this.lastDrawTime = timestamp;

    const delta = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    if (!this.shouldRender()) {
      this.loopNextFrame();
      return;
    }

    const updateStart = performance.now();
    try {
      this.editorService.gameEngine?.update(delta);
    } catch (error) {
      console.error("Error on User code", error);
    }
    const currentUpdateTime = performance.now() - updateStart;

    const timeSinceLastDraw = timestamp - this.lastDrawTime;
    this.editorService.onUpdateFrame.next(delta);

    if (timeSinceLastDraw >= this.frameInterval) {
      this.lastDrawTime = timestamp - (timeSinceLastDraw % this.frameInterval);
      const currentRenderTime = this.executeRenderPass();

      this.frameCount++;
      this.accumulatedFrameTime += currentUpdateTime + currentRenderTime;
      this.accumulatedUpdateTime += currentUpdateTime;
      this.accumulatedRenderTime += currentRenderTime;
    }

    if (timestamp - this.lastFpsUpdateTime >= 1000) {
      this.emitAndResetStats(timestamp);
    }

    this.loopNextFrame();
  }

  private trackBrowserOverhead(): void {
    const rafStart = performance.now();
    if (this.lastRafEndTime > 0) {
      this.accumulatedBrowserTime += rafStart - this.lastRafEndTime;
    }
    this.rafCount++;
  }

  private executeRenderPass(): number {
    let renderTime = 0;
    if (this.gl && this.canvasElement) {
      const renderStart = performance.now();
      const color =
        this.editorSettings.settings.viewportClearColor ||
        this.defaultClearColor;
      this.gl.clearColor(color.r, color.g, color.b, color.a);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
      try {
        this.editorService.gameEngine?.render();
      } catch (error) {
        console.log("Error on User code", error);
      }

      renderTime = performance.now() - renderStart;
      this.editorService.onRenderFrame.next(this.gl);
    }
    return renderTime;
  }

  private emitAndResetStats(timestamp: number): void {
    const fpsElapsed = timestamp - this.lastFpsUpdateTime;
    const actualFps = Math.round((this.frameCount / fpsElapsed) * 1000);

    this.ngZone.run(() =>
      this.stats.emit({
        fps: actualFps,
        frameTimeMs: Number(
          (this.accumulatedFrameTime / this.frameCount).toFixed(2),
        ),
        updateTimeMs: Number(
          (this.accumulatedUpdateTime / this.frameCount).toFixed(2),
        ),
        renderTimeMs: Number(
          (this.accumulatedRenderTime / this.frameCount).toFixed(2),
        ),
        browserTimeMs: Number(
          (this.accumulatedBrowserTime / this.rafCount).toFixed(2),
        ),
      }),
    );

    this.frameCount = 0;
    this.accumulatedFrameTime = 0;
    this.accumulatedUpdateTime = 0;
    this.accumulatedRenderTime = 0;
    this.rafCount = 0;
    this.accumulatedBrowserTime = 0;
    this.lastFpsUpdateTime = timestamp;
  }

  private loopNextFrame(): void {
    cleanLastFrame();
    this.animationFrameId = requestAnimationFrame(this.render.bind(this));
    this.lastRafEndTime = performance.now();
  }

  private setupWindowEvents(): void {
    this.ngZone.runOutsideAngular(() => {
      fromEvent(window, "resize")
        .pipe(debounceTime(50), takeUntil(this.destroy$))
        .subscribe(() => this.resizeCanvas(true));

      fromEvent(this.glCanvas.nativeElement, "contextmenu")
        .pipe(takeUntil(this.destroy$))
        .subscribe((e) => e.preventDefault());
    });
  }

  private async initWebGL(): Promise<void> {
    this.canvasElement = this.glCanvas.nativeElement;
    this.gl = this.canvasElement.getContext("webgl2");
    if (!this.gl) {
      console.error("Unable to initialize WebGL2.");
      return;
    }
    this.onGlContextCreated.emit(this.gl);
    this.resizeCanvas();
  }

  private async disposeWebGL(): Promise<void> {
    this.renderer.setAttribute(this.canvasElement, "width", "0");
    this.renderer.setAttribute(this.canvasElement, "height", "0");
    this.onGlContextCreated.emit(undefined);
  }

  private resizeCanvas(force = false): void {
    if (!this.glCanvas?.nativeElement) return;

    const displayWidth = this.glCanvas.nativeElement.clientWidth;
    const displayHeight = this.glCanvas.nativeElement.clientHeight;

    if (
      force ||
      this.canvasElement.width !== displayWidth ||
      this.canvasElement.height !== displayHeight
    ) {
      this.renderer.setAttribute(
        this.canvasElement,
        "width",
        displayWidth.toString(),
      );
      this.renderer.setAttribute(
        this.canvasElement,
        "height",
        displayHeight.toString(),
      );
      this.gl?.viewport(0, 0, displayWidth, displayHeight);
      CanvasViewport.rendererWidth = displayWidth;
      CanvasViewport.rendererHeight = displayHeight;
      this.updateCameraAspectRatio(displayWidth, displayHeight);
    }
  }

  private updateCameraAspectRatio(
    displayWidth: number,
    displayHeight: number,
  ): void {
    if (Camera.mainCamera) {
      Camera.mainCamera.aspectRatio = displayWidth / displayHeight;
      Camera.mainCamera.updateProjectionMatrix();
    }
  }

  setGizmoMode(mode: GizmoMode) {
    this.editorService.setGizmoMode(mode);
  }

  toggleTransformSpace() {
    const newSpace =
      this.transformSpace === TransformSpace.World
        ? TransformSpace.Local
        : TransformSpace.World;
    this.editorService.setTransformSpace(newSpace);
  }
}
