import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Keybord, Mouse } from '@engine/core/input';

import { Scene } from '@engine/entities/scene';
import { CanvasViewport } from '@engine/core/canvas-viewport';
import { Camera } from '@engine/entities/camera';
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
  private readonly frameInterval = 1000 / this.fps;
  public isFocused: boolean = false;


  public gl!: WebGLRenderingContext | null;

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

    Mouse.mouseButtonDown[event.button] = true;
    console.debug(event, Mouse.mouseButtonDown);
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {

    Mouse.mouseButtonDown[event.button] = false;
    event.preventDefault();
  }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.initWebGL();
    this.render(0);
    this.resizeCanvas();

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
    const elapsed = timestamp - this.lastTime;

    if (elapsed > this.frameInterval) {
      this.lastTime = timestamp - (elapsed % this.frameInterval);

      const delta = elapsed / 1000;
      this.scene.update(delta);

      if (this.gl && this.canvasElement) {
        this.scene.setGlRenderingContext(this.gl, this.canvasElement);
        this.scene.draw();
      }
      this.cleanInput();
    }

    requestAnimationFrame(this.render.bind(this));
  }

  private cleanInput(): void {
    Mouse.mouseMovement.x = 0;
    Mouse.mouseMovement.y = 0;
    Keybord.keyUp = {};
    Keybord.keyPress = {};
  }

  private async initWebGL(): Promise<void> {
    this.canvasElement = this.glCanvas.nativeElement;
    this.gl = this.canvasElement.getContext('webgl2');
    if (!this.gl) {
      alert('Unable to initialize WebGL. Your browser may not support it.');
      return;
    }

    this.onGlContextCreated.emit(this.gl);

  }

  private resizeCanvas(): void {
    const displayWidth = this.glCanvas.nativeElement.clientWidth;
    const displayHeight = this.glCanvas.nativeElement.clientHeight;

    if (this.glCanvas.nativeElement.width !== displayWidth || this.glCanvas.nativeElement.height !== displayHeight) {
      this.glCanvas.nativeElement.width = displayWidth;
      this.glCanvas.nativeElement.height = displayHeight;
      this.gl?.viewport(0, 0, this.glCanvas.nativeElement.width, this.glCanvas.nativeElement.height);
      CanvasViewport.rendererWidth = displayWidth;
      CanvasViewport.rendererHeight = displayHeight;
      this.updateCameraAspectRatio(displayWidth,displayHeight);
    }
  }

  private updateCameraAspectRatio(displayWidth:number,displayHeight:number){

    if (Camera.mainCamera) {
      Camera.mainCamera.aspectRatio = displayWidth / displayHeight;
      Camera.mainCamera?.updateProjectionMatrix();
    }
  }
}
