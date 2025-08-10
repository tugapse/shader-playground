import { Vec2, Vec4 } from "./vec";

export class Shader {
  constructor(private gl: WebGLRenderingContext) { }
  public shaderProgram!: WebGLProgram | null;
  public vertexBuffer!: WebGLBuffer | null;
  private loaded=false;

  public async load(): Promise<void> {
    const vsSource = await this.loadShaderSource('assets/shaders/vertex.glsl');
    const fsSource = await this.loadShaderSource('assets/shaders/fragment.glsl');

    const vertexShader = this.compileShader(this.gl, this.gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.compileShader(this.gl, this.gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) {
      return;
    }
    this.shaderProgram = this.createProgram(this.gl, vertexShader, fragmentShader);
    this.loaded=true;
  }

  public use(){
      if (!this.shaderProgram || !this.loaded) {
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

  public setVertexBuffer(vertices:Vec4[]){
      const arrayBuffer = vertices.reduce((acc:number[],curr:Vec4)=> [...acc,...curr.toArrayBuffer()] ,[])
      this.vertexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayBuffer), this.gl.STATIC_DRAW);
  }
}
