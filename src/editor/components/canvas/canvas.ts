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
} from '@angular/core';
import { EditorService } from '@editor/services/editor.service';
import { Camera, CanvasViewport, cleanLastFrame, Engine, Scene } from '@engine';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

export interface EngineStats {
  fps: number;
  frameTimeMs: number;
  updateTimeMs: number;
  renderTimeMs: number;
  browserTimeMs: number;
}

@Component({
  selector: 'editor-canvas',
  imports: [],
  templateUrl: './canvas.html',
  styleUrl: './canvas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Canvas implements OnDestroy, AfterViewInit {
  @Input() set scene(scene: Scene) {
    if (!scene) return;
    if (this.gameEngine) this.gameEngine.loadScene(scene);
  }
  @Input() public gameEngine!: Engine;

  @Output() onGlContextCreated = new EventEmitter<WebGL2RenderingContext>();
  @Output() stats = new EventEmitter<EngineStats>();

  @ViewChild('glCanvas') private glCanvas!: ElementRef<HTMLCanvasElement>;

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

  constructor(
    private editorService: EditorService,
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
  }

  ngAfterViewInit(): void {
    this.initWebGL();
    this.gameEngine.initialize(this.canvasElement);
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
    this.gameEngine.destroy();
    // this.scene?.destroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  public shouldRender(): boolean {
    return this.gameEngine.isTabActive && this.gameEngine.isWindowFocused;
  }

  public render(timestamp: number): void {
    // Measure the gap since the end of the last render call
    const rafStart = performance.now();
    if (this.lastRafEndTime > 0) {
      this.accumulatedBrowserTime += rafStart - this.lastRafEndTime;
    }
    this.rafCount++;

    if (!this.lastTime) this.lastTime = timestamp;
    if (!this.lastDrawTime) this.lastDrawTime = timestamp;

    const delta = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    if (!this.shouldRender()) {
      this.cleanInput();
      this.animationFrameId = requestAnimationFrame(this.render.bind(this));
      this.lastRafEndTime = performance.now();
      return;
    }

    const updateStart = performance.now();
    this.gameEngine.update(delta);
    // this.scene.update(delta);
    const currentUpdateTime = performance.now() - updateStart;

    const timeSinceLastDraw = timestamp - this.lastDrawTime;
    let currentRenderTime = 0;
    this.editorService.onUpdateFrame.next(delta);

    if (timeSinceLastDraw >= this.frameInterval) {
      this.lastDrawTime = timestamp - (timeSinceLastDraw % this.frameInterval);

      if (this.gl && this.canvasElement) {
        const renderStart = performance.now();
        this.gameEngine.render();
        // this.scene.draw();
        currentRenderTime = performance.now() - renderStart;
        this.editorService.onRenderFrame.next(this.gl);
      }
      this.frameCount++;

      this.accumulatedFrameTime += currentUpdateTime + currentRenderTime;
      this.accumulatedUpdateTime += currentUpdateTime;
      this.accumulatedRenderTime += currentRenderTime;
    }

    const fpsElapsed = timestamp - this.lastFpsUpdateTime;

    if (fpsElapsed >= 1000) {
      const actualFps = Math.round((this.frameCount / fpsElapsed) * 1000);
      const avgFrameTime = this.accumulatedFrameTime / this.frameCount;
      const avgUpdateTime = this.accumulatedUpdateTime / this.frameCount;
      const avgRenderTime = this.accumulatedRenderTime / this.frameCount;

      // Calculate overhead average based on total rAF cycles, not just drawn frames
      const avgBrowserTime = this.accumulatedBrowserTime / this.rafCount;

      this.ngZone.run(() =>
        this.stats.emit({
          fps: actualFps,
          frameTimeMs: Number(avgFrameTime.toFixed(2)),
          updateTimeMs: Number(avgUpdateTime.toFixed(2)),
          renderTimeMs: Number(avgRenderTime.toFixed(2)),
          browserTimeMs: Number(avgBrowserTime.toFixed(2)),
        }),
      );

      // Reset counters
      this.frameCount = 0;
      this.accumulatedFrameTime = 0;
      this.accumulatedUpdateTime = 0;
      this.accumulatedRenderTime = 0;

      this.rafCount = 0;
      this.accumulatedBrowserTime = 0;

      this.lastFpsUpdateTime = timestamp;
    }

    this.cleanInput();
    this.animationFrameId = requestAnimationFrame(this.render.bind(this));

    // Record the exact exit time of the execution context
    this.lastRafEndTime = performance.now();
  }

  private cleanInput(): void {
    cleanLastFrame();
  }

  private setupWindowEvents(): void {
    this.ngZone.runOutsideAngular(() => {
      fromEvent(window, 'resize')
        .pipe(debounceTime(50), takeUntil(this.destroy$))
        .subscribe(() => this.resizeCanvas(true));

      fromEvent(this.glCanvas.nativeElement, 'contextmenu')
        .pipe(takeUntil(this.destroy$))
        .subscribe((e) => e.preventDefault());
    });
  }

  private async initWebGL(): Promise<void> {
    this.canvasElement = this.glCanvas.nativeElement;
    this.gl = this.canvasElement.getContext('webgl2');
    if (!this.gl) {
      console.error('Unable to initialize WebGL2.');
      return;
    }
    this.onGlContextCreated.emit(this.gl);
    this.resizeCanvas();
  }

  private async disposeWebGL(): Promise<void> {
    this.renderer.setAttribute(this.canvasElement, 'width', '0');
    this.renderer.setAttribute(this.canvasElement, 'height', '0');
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
        'width',
        displayWidth.toString(),
      );
      this.renderer.setAttribute(
        this.canvasElement,
        'height',
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
}
