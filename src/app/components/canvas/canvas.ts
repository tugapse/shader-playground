import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Scene } from '../../../engine/core/scene';
import { Keybord } from '../../../engine/core/input'

@Component({
  selector: 'app-canvas',
  imports: [],
  templateUrl: './canvas.html',
  styleUrl: './canvas.scss'
})
export class Canvas implements OnChanges {

  @Input() scene!: Scene;

  @Output() onGlContextCreated: EventEmitter<WebGLRenderingContext> = new EventEmitter();

  @ViewChild('glCanvas')
  private glCanvas!: ElementRef<HTMLCanvasElement>;
  private canvasElement!: HTMLCanvasElement;

  private lastTime = 0;
  private readonly fps = 60;
  private readonly frameInterval = 100 / this.fps;
  public isFocused: boolean = false;


  public gl!: WebGLRenderingContext | null;

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.resizeCanvas();
  }


  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
      Keybord.keyState[event.key.toLowerCase()] = true;
  }

  @HostListener('keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
      Keybord.keyState[event.key.toLowerCase()] = false;
  }
  // Listen for the component to gain focus
  @HostListener('focus')
  onFocus() {
    this.isFocused = true;
  }

  // Listen for the component to lose focus
  @HostListener('blur')
  onBlur() {
    this.isFocused = false;
  }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.initWebGL();
    this.render(0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['scene'].currentValue != this.scene) {
      const newScene: Scene = changes['scene'].currentValue;
      if (changes['scene'].previousValue) changes['scene'].previousValue.destroy()
      if (this.gl && this.canvasElement) newScene.setGlRenderingContext(this.gl, this.canvasElement);
    }
  }

  ngOnDestroy(): void {
    this.scene?.destroy();
  }

  public render(timestamp: number) {
    // Calculate the time that has passed since the last frame was rendered.
    const elapsed = timestamp - this.lastTime;

    // Only proceed with rendering if enough time has passed.
    if (elapsed > this.frameInterval) {
      // Correct the lastTime by the elapsed time. This is better than just
      // setting it to 'timestamp' to account for small variances and keep
      // the average FPS consistent.
      this.lastTime = timestamp - (elapsed % this.frameInterval);

      // Your original logic for updating and drawing the scene.
      // The delta is still needed for physics and animations.
      const delta = elapsed / 1000;
      this.scene.update(delta);

      if (this.gl && this.canvasElement) {
        this.scene.setGlRenderingContext(this.gl, this.canvasElement);
        this.scene.draw();
      }
    }

    // Always request the next frame. This ensures the loop continues
    // regardless of whether a frame was rendered or skipped.
    requestAnimationFrame(this.render.bind(this));
  }

  private async initWebGL(): Promise<void> {
    this.canvasElement = this.glCanvas.nativeElement;
    this.gl = this.canvasElement.getContext('webgl');
    if (!this.gl) {
      alert('Unable to initialize WebGL. Your browser may not support it.');
      return;
    }

    this.resizeCanvas();
    this.onGlContextCreated.emit(this.gl);

  }

  private resizeCanvas(): void {
    const displayWidth = this.glCanvas.nativeElement.clientWidth;
    const displayHeight = this.glCanvas.nativeElement.clientHeight;

    if (this.glCanvas.nativeElement.width !== displayWidth || this.glCanvas.nativeElement.height !== displayHeight) {
      this.glCanvas.nativeElement.width = displayWidth;
      this.glCanvas.nativeElement.height = displayHeight;
      this.gl?.viewport(0, 0, this.glCanvas.nativeElement.width, this.glCanvas.nativeElement.height);
    }
  }

}
