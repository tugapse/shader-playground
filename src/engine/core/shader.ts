import { Vec2, Vec4 } from "./vec";

export class Shader {

  constructor(
    private gl: WebGLRenderingContext,
    private fragUri: string = "assets/shaders/fragment.glsl",
    private vertexUri: string = "assets/shaders/vertex.glsl") { }

  public shaderProgram!: WebGLProgram;
  public vertexBuffer!: WebGLBuffer | null;
  private initialized = false;

  public async initialize(): Promise<void> {

    if (this.initialized) {
      return;
    }

    const vsSource = await this.loadShaderSource(this.vertexUri);
    const fsSource = await this.loadShaderSource(this.fragUri);

    const vertexShader = this.compileShader(this.gl, this.gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.compileShader(this.gl, this.gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) {
      return;
    }
    this.shaderProgram = this.createProgram(this.gl, vertexShader, fragmentShader) as WebGLProgram;

    this.initialized = true;
  }

  public load() {
    if(!this.gl|| !this.shaderProgram) return;
    const positionAttributeLocation = this.gl.getAttribLocation(this.shaderProgram, 'a_position');
    this.gl.vertexAttribPointer(positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(positionAttributeLocation);

  }

  public use() {
    if (!this.shaderProgram || !this.initialized) {
      return;
    }
    this.gl.useProgram(this.shaderProgram);
  }

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

  public setVertexBuffer(vertices: Vec4[]) {
    const arrayBuffer = vertices.reduce((acc: number[], curr: Vec4) => [...acc, ...curr.toArrayBuffer()], [])
    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayBuffer), this.gl.STATIC_DRAW);
  }

  public destroy() {
    this.gl.deleteBuffer(this.vertexBuffer);
    this.gl.deleteProgram(this.shaderProgram);
  }
}
