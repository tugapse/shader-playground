import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { EditorService } from '@editor/services/editor.service';
import { Camera, CanvasViewport, Engine, Keybord, Mouse, Scene, cleanLastFrame } from 'omega-game-engine';
@Component({
  selector: 'editor-canvas',
  imports: [],
  templateUrl: './canvas.html',
  styleUrl: './canvas.scss'
})
export class Canvas implements OnChanges {

  @Input() scene!: Scene;

  @Output() onGlContextCreated: EventEmitter<WebGL2RenderingContext> = new EventEmitter();


  @ViewChild('glCanvas')
  private glCanvas!: ElementRef<HTMLCanvasElement>;
  private canvasElement!: HTMLCanvasElement;

  private lastTime = 0;
  private readonly fps = 60;
  private readonly frameInterval = 1000 / this.fps;
  public isFocused: boolean = false;
  private isTabActive: boolean = true;
  private isWindowFocused: boolean = true;


  public gl!: WebGL2RenderingContext | null;

  public gameEngine: Engine;

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent) {
    event.preventDefault();
    // Here you can add logic to show your custom context menu
  }
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.resizeCanvas();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    Keybord.keyDown[event.key.toLowerCase()] = true;
  }

  @HostListener('keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    if (Keybord.keyDown[event.key.toLowerCase()]) {
      Keybord.keyUp[event.key.toLowerCase()] = true;
      Keybord.keyPress[event.key.toLowerCase()] = true;
    }
    Keybord.keyDown[event.key.toLowerCase()] = false;
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    const canvasRect = this.canvasElement.getBoundingClientRect();
    Mouse.mousePosition.x = Math.max(event.clientX - canvasRect.x, 0);
    Mouse.mousePosition.y = Math.max(event.clientY - canvasRect.y, 0);
    Mouse.mouseMovement.x = event.movementX;
    Mouse.mouseMovement.y = event.movementY;
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    if (this.isFocused) event.preventDefault(); {
    }
    Mouse.mouseButtonDown[event.button] = true;
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    Mouse.mouseButtonDown[event.button] = false;
  }

  @HostListener('mouseleave', [])
  onMouseLeave(): void {
    for (const buttonIndex in Mouse.mouseButtonDown) {
      if (Mouse.mouseButtonDown[buttonIndex]) {
        Mouse.mouseButtonDown[buttonIndex] = false;
      }
    }
  }

  @HostListener('focus', ['$event.target!'])
  onFocus(target: EventTarget): void {
    this.isFocused = true
  }

  @HostListener('blur', ['$event.target!'])
  onBlur(target: EventTarget): void {
    this.isFocused = false;

  }

  @HostListener('window:wheel', ['$event'])
  onMouseScroll(event: WheelEvent): void {
    if (!this.isFocused) return;
    Mouse.wheelY = event.deltaY;
    Mouse.wheelX = event.deltaX;
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange() {
    this.isTabActive = !document.hidden;
  }

  @HostListener('window:focus')
  onWindowFocus() {
    this.isWindowFocused = true;
  }

  @HostListener('window:blur')
  onWindowBlur() {
    this.isWindowFocused = false;
  }

  constructor(private editorService: EditorService) {
    this.gameEngine = new Engine();
    this.editorService.onCanvasRequestResize.subscribe(() => this.resizeCanvas(true));
    this.editorService.onCanvasRequestReset.subscribe(() => { this.disposeWebGL(); this.initWebGL() });
  }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.initWebGL();
    this.gameEngine.initialize(this.canvasElement);
    this.render(0);
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
  }

  public shouldRender() {
    return this.isTabActive && this.isWindowFocused;
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
      this.editorService.onRenderFrame.next(this.gl);
      if (this.gl && this.canvasElement) {
        this.scene.draw();
      }
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
    this.canvasElement.width = 0;
    this.canvasElement.height = 0;
    this.onGlContextCreated.emit(undefined);

  }

  private resizeCanvas(force = false): void {
    const displayWidth = this.glCanvas.nativeElement.clientWidth;
    const displayHeight = this.glCanvas.nativeElement.clientHeight;

    if (force || (this.glCanvas.nativeElement.width !== displayWidth || this.glCanvas.nativeElement.height !== displayHeight)) {
      this.glCanvas.nativeElement.width = displayWidth;
      this.glCanvas.nativeElement.height = displayHeight;
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
