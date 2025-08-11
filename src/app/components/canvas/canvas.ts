import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Scene } from '../../../engine/core/scene';

@Component({
  selector: 'app-canvas',
  imports: [],
  templateUrl: './canvas.html',
  styleUrl: './canvas.scss'
})
export class Canvas implements OnChanges {

  @Input() scene!:Scene;

  @Output() onGlContextCreated:EventEmitter<WebGLRenderingContext> = new EventEmitter();

  @ViewChild('glCanvas')
  private glCanvas!: ElementRef<HTMLCanvasElement>;
  private canvasElement!:HTMLCanvasElement;

  private lastTime = 0;
  private readonly fps = 30;
  private readonly frameInterval = 1000/this.fps;

  public gl!:WebGLRenderingContext | null;

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.resizeCanvas();
  }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.initWebGL();
    this.render(new Date().getMilliseconds());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['scene'].currentValue != this.scene){
      const newScene:Scene = changes['scene'].currentValue;
      if(changes['scene'].previousValue) changes['scene'].previousValue.destroy()
        newScene.setGlRenderingContext(this.gl as WebGLRenderingContext);
    }
  }

  ngOnDestroy(): void {
    this.scene?.destroy();
  }

  public render(timestamp: number) {

    if(this.scene){
      const delta = timestamp - this.lastTime;
      this.scene.update(delta);

        this.lastTime = timestamp;
        this.scene.setGlRenderingContext(this.gl as WebGL2RenderingContext)
        this.scene.draw();

    }

    const now =new Date().getMilliseconds();
    requestAnimationFrame(this.render.bind(this, now));
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
