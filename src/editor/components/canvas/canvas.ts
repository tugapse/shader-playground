import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, NgZone, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, Renderer2, AfterViewInit } from '@angular/core';
import { EditorService } from '@editor/services/editor.service';
import { Camera, CanvasViewport, cleanLastFrame, Engine, Scene } from '@engine';
import { Subject, fromEvent } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

export interface EngineStats {
  fps: number;
  frameTimeMs: number;
  updateTimeMs: number;
  renderTimeMs: number;
}

@Component({
  selector: 'editor-canvas',
  imports: [],
  templateUrl: './canvas.html',
  styleUrl: './canvas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Canvas implements OnChanges, OnDestroy, AfterViewInit {
  @Input() scene!: Scene;

  @Output() onGlContextCreated = new EventEmitter<WebGL2RenderingContext >();
  @Output() stats = new EventEmitter<EngineStats>();

  @ViewChild('glCanvas') private glCanvas!: ElementRef<HTMLCanvasElement>;
  
  public gl!: WebGL2RenderingContext | null;
  public gameEngine: Engine;

  private canvasElement!: HTMLCanvasElement;
  private lastTime = 0;
  private lastDrawTime = 0;
  private lastFpsUpdateTime = 0;
  private frameCount = 0;
  private animationFrameId: number | null = null;
  
  private accumulatedFrameTime = 0;
  private accumulatedUpdateTime = 0;
  private accumulatedRenderTime = 0;
  
  private readonly targetFps = 60;
  private readonly frameInterval = 1000 / this.targetFps;
  private destroy$ = new Subject<void>();






  constructor(
    private editorService: EditorService, 
    private ngZone: NgZone, 
    private renderer: Renderer2
  ) {
    this.gameEngine = new Engine();
    this.editorService.onCanvasRequestResize.pipe(takeUntil(this.destroy$)).subscribe(() => this.resizeCanvas(true));
    this.editorService.onCanvasRequestReset.pipe(takeUntil(this.destroy$)).subscribe(() => { 
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['scene'].currentValue !== this.scene) {
      const newScene: Scene = changes['scene'].currentValue;
      if (changes['scene'].previousValue) changes['scene'].previousValue.destroy();
      if (this.gl && this.canvasElement) newScene.setGlRenderingContext(this.gl);
      this.resizeCanvas(true);
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.scene?.destroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  public shouldRender(): boolean {
    return this.gameEngine.isTabActive && this.gameEngine.isWindowFocused;
  }

  public render(timestamp: number): void {
    if (!this.lastTime) this.lastTime = timestamp;
    if (!this.lastDrawTime) this.lastDrawTime = timestamp;

    const delta = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    if (!this.scene || !this.shouldRender()) {
      this.cleanInput();
      this.animationFrameId = requestAnimationFrame(this.render.bind(this));
      return;
    }

    const updateStart = performance.now();
    this.scene.update(delta);
    const currentUpdateTime = performance.now() - updateStart;

    const timeSinceLastDraw = timestamp - this.lastDrawTime;
    let currentRenderTime = 0;
    
    if (timeSinceLastDraw >= this.frameInterval) {
      this.lastDrawTime = timestamp - (timeSinceLastDraw % this.frameInterval);
      
      this.editorService.onUpdateFrame.next(delta);
      
      if (this.gl && this.canvasElement) {
        const renderStart = performance.now();
        this.scene.draw();
        currentRenderTime = performance.now() - renderStart;
        
        this.editorService.onRenderFrame.next(this.gl);
      }
      this.frameCount++;

      this.accumulatedFrameTime += (currentUpdateTime + currentRenderTime);
      this.accumulatedUpdateTime += currentUpdateTime;
      this.accumulatedRenderTime += currentRenderTime;
    }

    const fpsElapsed = timestamp - this.lastFpsUpdateTime;
    if (fpsElapsed >= 1000) {
      const actualFps = Math.round((this.frameCount / fpsElapsed) * 1000);
      const avgFrameTime = this.accumulatedFrameTime / this.frameCount;
      const avgUpdateTime = this.accumulatedUpdateTime / this.frameCount;
      const avgRenderTime = this.accumulatedRenderTime / this.frameCount;

      this.ngZone.run(() => this.stats.emit({
        fps: actualFps,
        frameTimeMs: Number(avgFrameTime.toFixed(2)),
        updateTimeMs: Number(avgUpdateTime.toFixed(2)),
        renderTimeMs: Number(avgRenderTime.toFixed(2))
      }));

      this.frameCount = 0;
      this.accumulatedFrameTime = 0;
      this.accumulatedUpdateTime = 0;
      this.accumulatedRenderTime = 0;
      this.lastFpsUpdateTime = timestamp;
    }

    this.cleanInput();
    this.animationFrameId = requestAnimationFrame(this.render.bind(this));
  }

  private cleanInput(): void {
    cleanLastFrame();
  }

  private setupWindowEvents(): void {
    this.ngZone.runOutsideAngular(() => {
      fromEvent(window, 'resize')
        .pipe(debounceTime(50), takeUntil(this.destroy$))
        .subscribe(() => this.resizeCanvas());

      fromEvent(this.glCanvas.nativeElement, 'contextmenu')
        .pipe(takeUntil(this.destroy$))
        .subscribe(e => e.preventDefault());
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

    if (force || this.canvasElement.width !== displayWidth || this.canvasElement.height !== displayHeight) {
      this.renderer.setAttribute(this.canvasElement, 'width', displayWidth.toString());
      this.renderer.setAttribute(this.canvasElement, 'height', displayHeight.toString());
      this.gl?.viewport(0, 0, displayWidth, displayHeight);
      CanvasViewport.rendererWidth = displayWidth;
      CanvasViewport.rendererHeight = displayHeight;
      this.updateCameraAspectRatio(displayWidth, displayHeight);
    }
  }

  private updateCameraAspectRatio(displayWidth: number, displayHeight: number): void {
    if (Camera.mainCamera) {
      Camera.mainCamera.aspectRatio = displayWidth / displayHeight;
      Camera.mainCamera.updateProjectionMatrix();
    }
  }
}