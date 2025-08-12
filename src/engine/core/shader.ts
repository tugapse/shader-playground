import { mat4, vec2, vec3, vec4 } from "gl-matrix";

export class Shader {

  constructor(
    private gl: WebGLRenderingContext,
    private fragUri: string = "assets/shaders/frag/fragment.glsl",
    private vertexUri: string = "assets/shaders/vertex/vertex.glsl") { }

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
    if (!this.gl || !this.shaderProgram) return;
    const positionAttributeLocation = this.gl.getAttribLocation(this.shaderProgram, 'a_position');
    this.gl.vertexAttribPointer(positionAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(positionAttributeLocation);

  }

  public use() {
    if (!this.shaderProgram || !this.initialized) {
      return;
    }
    this.gl.useProgram(this.shaderProgram);
  }

  public setMat4(name: string, matrix: mat4) {
    const location = this.gl.getUniformLocation(this.shaderProgram, name);
    if (location) {
      this.gl.uniformMatrix4fv(location, false, matrix);
    }
  }
  public setVec4(name: string, vec: vec4) {
    const location = this.gl.getUniformLocation(this.shaderProgram, name);
    if (location) {
      this.gl.uniform4fv(location, vec);
    }
  }
  public setVec3(name: string, vec: vec3) {
    const location = this.gl.getUniformLocation(this.shaderProgram, name);
    if (location) {
       this.gl.uniform3fv(location, vec);
    }
  }

  public setVec2(name: string, vec: vec2) {
    const location = this.gl.getUniformLocation(this.shaderProgram, name);
    if (location) {
       this.gl.uniform2fv(location, vec);
    }
  }

    public setfloat(name: string, num: number) {
    const location = this.gl.getUniformLocation(this.shaderProgram, name);
    if (location) {
       this.gl.uniform1f(location, num);
    }
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

  public setVertexBuffer(vertices: vec3[]) {
    const arrayBuffer = vertices.reduce((acc: number[], curr: vec3) => [...acc, ...curr], [])
    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(arrayBuffer), this.gl.STATIC_DRAW);
  }

  public destroy() {
    this.gl.deleteBuffer(this.vertexBuffer);
    this.gl.deleteProgram(this.shaderProgram);
  }
}
