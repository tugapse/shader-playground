import { Component, AfterViewInit, ViewChild, ElementRef, OnInit, OnDestroy, HostListener } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('glCanvas') glCanvas!: ElementRef<HTMLCanvasElement>;

  private gl!: WebGLRenderingContext;
  private shaderProgram!: WebGLProgram|null;
  private positionAttributeLocation!: number;
  private vertexBuffer!: WebGLBuffer | null;

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.resizeCanvas();
    this.drawScene();
  }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.initWebGL();
  }

  ngOnDestroy(): void {
    if (this.gl) {
      this.gl.deleteBuffer(this.vertexBuffer);
      this.gl.deleteProgram(this.shaderProgram);
    }
  }

  private resizeCanvas(): void {
    const displayWidth = this.glCanvas.nativeElement.clientWidth;
    const displayHeight = this.glCanvas.nativeElement.clientHeight;

    if (this.glCanvas.nativeElement.width !== displayWidth || this.glCanvas.nativeElement.height !== displayHeight) {
      this.glCanvas.nativeElement.width = displayWidth;
      this.glCanvas.nativeElement.height = displayHeight;
      this.gl.viewport(0, 0, this.glCanvas.nativeElement.width, this.glCanvas.nativeElement.height);
    }
  }

  private drawScene(): void {
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Draw the full-screen quad (6 vertices)
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  async initWebGL(): Promise<void> {
    const canvas = this.glCanvas.nativeElement;
    const gl = canvas.getContext('webgl');

    if (!gl) {
      alert('Unable to initialize WebGL. Your browser may not support it.');
      return;
    }
    this.gl = gl;

    this.resizeCanvas();

    try {
      const vsSource = await this.loadShaderSource('assets/shaders/vertex.glsl');
      const fsSource = await this.loadShaderSource('assets/shaders/fragment.glsl');

      const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, vsSource);
      const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

      if (!vertexShader || !fragmentShader) {
        return;
      }

      this.shaderProgram = this.createProgram(gl, vertexShader, fragmentShader);
      if (!this.shaderProgram) {
        return;
      }

      gl.useProgram(this.shaderProgram);

      // Define vertices for a full-screen quad
      const vertices = new Float32Array([
        -1.0, -1.0,  // Bottom-left
         1.0, -1.0,  // Bottom-right
        -1.0,  1.0,  // Top-left
        -1.0,  1.0,  // Top-left
         1.0, -1.0,  // Bottom-right
         1.0,  1.0   // Top-right
      ]);

      this.vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      this.positionAttributeLocation = gl.getAttribLocation(this.shaderProgram, 'a_position');
      gl.vertexAttribPointer(this.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(this.positionAttributeLocation);

      this.drawScene();

    } catch (error) {
      console.error(error);
    }
  }

  // (Helper methods loadShaderSource, compileShader, createProgram remain unchanged)
  private async loadShaderSource(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load shader: ${url}`);
    }
    return response.text();
  }

  private compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) { return null; }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('An error occurred compiling the shader:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null {
    const shaderProgram = gl.createProgram();
    if (!shaderProgram) { return null; }
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error('Unable to initialize the shader program:', gl.getProgramInfoLog(shaderProgram));
      return null;
    }
    return shaderProgram;
  }
}
