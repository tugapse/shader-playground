import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild, NgZone, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, Renderer2 } from '@angular/core';
import { EditorService } from '@editor/services/editor.service';
import { Camera, CanvasViewport, Scene, cleanLastFrame, Keybord, Mouse, Engine } from 'omega-game-engine';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
@Component({
  selector: 'editor-canvas',
  imports: [],
  templateUrl: './canvas.html',
  styleUrl: './canvas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Canvas implements OnChanges, OnDestroy {

  @Input() scene!: Scene;

  @Output() onGlContextCreated: EventEmitter<WebGL2RenderingContext> = new EventEmitter();
  @Output() fps = new BehaviorSubject(0);


  @ViewChild('glCanvas')
  private glCanvas!: ElementRef<HTMLCanvasElement>;
  private canvasElement!: HTMLCanvasElement;

  private lastTime = 0;
  private readonly targetFps = 60;
  private readonly frameInterval = 1000 / this.targetFps;
  private frameCount = 0;

  public gl!: WebGL2RenderingContext | null;

  public gameEngine: Engine;

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent) {
    event.preventDefault();
  }
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.resizeCanvas();
  }
  private lastFpsUpdateTime = 0;
  private destroy$ = new Subject<void>();

  constructor(private editorService: EditorService, private ngZone: NgZone, private cd: ChangeDetectorRef, private renderer: Renderer2) {
    this.gameEngine = new Engine();
    this.editorService.onCanvasRequestResize.pipe(takeUntil(this.destroy$)).subscribe(() => this.resizeCanvas(true));
    this.editorService.onCanvasRequestReset.pipe(takeUntil(this.destroy$)).subscribe(() => { this.disposeWebGL(); this.initWebGL() });
  }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.initWebGL();
    this.gameEngine.initialize(this.canvasElement);
    this.ngZone.runOutsideAngular(() => {
      this.render(0);
    });
    this.resizeCanvas();


  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['scene'].currentValue != this.scene) {
      const newScene: Scene = changes['scene'].currentValue;
      if (changes['scene'].previousValue) changes['scene'].previousValue.destroy()
      if (this.gl && this.canvasElement) newScene.setGlRenderingContext(this.gl);
      this.resizeCanvas(true);
    }
  }

  ngOnDestroy(): void {
    this.scene?.destroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  public shouldRender() {
    return this.gameEngine.isTabActive && this.gameEngine.isWindowFocused;
  }

  public render(timestamp: number) {
    const elapsed = timestamp - this.lastTime;
    if (!this.scene || this.shouldRender() == false) {
      setTimeout(() => requestAnimationFrame(this.render.bind(this)), 50);
      this.cleanInput();
      this.lastTime = timestamp - (elapsed % this.frameInterval);
      return;
    }
    if (elapsed > this.frameInterval) {
      this.lastTime = timestamp - (elapsed % this.frameInterval);
      const delta = elapsed / 1000;
      this.editorService.onUpdateFrame.next(delta);
      this.scene.update(delta);
      if (this.gl && this.canvasElement) {
        this.scene.draw();
        this.editorService.onRenderFrame.next(this.gl);
      }
    }
    this.frameCount++;
    const fpsElapsed = timestamp - this.lastFpsUpdateTime;
    if (fpsElapsed >= 1000) {
      const actualFps = (this.frameCount / fpsElapsed) * 1000;
      this.ngZone.run(() => {
        this.fps.next(Math.round(actualFps));
      });
      this.frameCount = 0;
      this.lastFpsUpdateTime = timestamp;
    }
    this.cleanInput();
    requestAnimationFrame(this.render.bind(this));
  }

  private cleanInput(): void {
    cleanLastFrame()
  }

  private async initWebGL(): Promise<void> {
    this.canvasElement = this.glCanvas.nativeElement;
    this.gl = this.canvasElement.getContext('webgl2');
    if (!this.gl) {
      alert('Unable to initialize WebGL. Your browser may not support it.');
      return;
    }

    this.onGlContextCreated.emit(this.gl);
    this.resizeCanvas();
  }
  private async disposeWebGL(): Promise<void> {
    this.canvasElement = this.glCanvas.nativeElement;
    this.renderer.setAttribute(this.canvasElement, 'width', '0');
    this.renderer.setAttribute(this.canvasElement, 'height', '0');
    this.onGlContextCreated.emit(undefined);
  }

  private resizeCanvas(force = false): void {
    const displayWidth = this.glCanvas.nativeElement.clientWidth;
    const displayHeight = this.glCanvas.nativeElement.clientHeight;

    if (force || (this.glCanvas.nativeElement.width !== displayWidth || this.glCanvas.nativeElement.height !== displayHeight)) {
      this.renderer.setAttribute(this.glCanvas.nativeElement, 'width', displayWidth.toString());
      this.renderer.setAttribute(this.glCanvas.nativeElement, 'height', displayHeight.toString());
      this.gl?.viewport(0, 0, this.glCanvas.nativeElement.width, this.glCanvas.nativeElement.height);
      CanvasViewport.rendererWidth = displayWidth;
      CanvasViewport.rendererHeight = displayHeight;
      this.updateCameraAspectRatio(displayWidth, displayHeight);
    }
  }

  private updateCameraAspectRatio(displayWidth: number, displayHeight: number) {

    if (Camera.mainCamera) {
      Camera.mainCamera.aspectRatio = displayWidth / displayHeight;
      Camera.mainCamera.updateProjectionMatrix();
    }
  }
}
