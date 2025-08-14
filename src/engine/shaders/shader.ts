import { mat4, vec2, vec3, vec4 } from "gl-matrix";
import { Material } from "../materials/material";
import { Texture } from "../materials/texture";
import { ShaderUniformsEnum } from "../enums/shader-uniforms";
import { ColorMaterial } from "../materials/color-material";
import { MeshData } from "@engine/core/mesh";
export interface WebGLBuffers {
  position: WebGLBuffer | null;
  normal: WebGLBuffer | null;
  uv: WebGLBuffer | null;
  indices: WebGLBuffer | null;
}


export class Shader {

  public shaderProgram!: WebGLProgram;
  private initialized = false;
  public buffers: WebGLBuffers = {
    position: null,
    normal: null,
    uv: null,
    indices: null,
  };

  constructor(
    protected gl: WebGLRenderingContext,
    public material: Material,
    public fragUri: string = "assets/shaders/frag/color.glsl",
    public vertexUri: string = "assets/shaders/vertex/vertex.glsl"
  ) { }

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

  initBuffers(gl: WebGLRenderingContext, mesh: MeshData): void {
    const buffers: WebGLBuffers = {
      position: null,
      normal: null,
      uv: null,
      indices: null,
    };

    // --- Position Buffer ---
    buffers.position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    // Explicitly flatten the vec3[] into a single Float32Array
    const positions: number[] = [];
    for (const v of mesh.vertices) {
      positions.push(v[0], v[1], v[2]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // --- Normal Buffer ---
    buffers.normal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    // Explicitly flatten the vec3[] into a single Float32Array
    const normals: number[] = [];
    for (const n of mesh.normals) {
      normals.push(n[0], n[1], n[2]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    // --- UV Buffer ---
    buffers.uv = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uv);
    // Explicitly flatten the vec2[] into a single Float32Array
    const uvs: number[] = [];
    for (const uv of mesh.uvs) {
      uvs.push(uv[0], uv[1]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);

    // --- Index Buffer ---
    buffers.indices = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    // Indices are typically Uint16Array for up to 65,535 vertices.
    // If your mesh has more vertices, you would use Uint32Array and gl.UNSIGNED_INT.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);

    this.buffers = buffers;
  }

  public bindBuffers() {
    if (!this.gl || !this.shaderProgram) return;
    // --- Position Attribute ---
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
    const positionAttributeLocation = this.gl.getAttribLocation(this.shaderProgram, 'a_position');
    this.gl.vertexAttribPointer(positionAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(positionAttributeLocation);

    // --- Normal Attribute ---
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.normal);
    const normalAttributeLocation = this.gl.getAttribLocation(this.shaderProgram, 'a_normal'); // Make sure your shader has 'a_normal'
    this.gl.vertexAttribPointer(normalAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(normalAttributeLocation);

    // --- UV Attribute ---
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.uv);
    const uvAttributeLocation = this.gl.getAttribLocation(this.shaderProgram, 'a_uv'); // Make sure your shader has 'a_uv'
    this.gl.vertexAttribPointer(uvAttributeLocation, 2, this.gl.FLOAT, false, 0, 0); // UVs are 2D (vec2)
    this.gl.enableVertexAttribArray(uvAttributeLocation);

    // --- Bind Index Buffer for Drawing ---
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);

  }

  public use() {
    if (!this.shaderProgram || !this.initialized) {
      return;
    }
    this.gl.useProgram(this.shaderProgram);
  }

  public loadDataIntoShader() {
    const material = this.material as ColorMaterial;
    this.setVec4(ShaderUniformsEnum.U_MAT_COLOR, material.color);
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

  public setTexture(name: string, texture: Texture, textureIndex: number) {
    const location = this.gl.getUniformLocation(this.shaderProgram, name);
    if (location) {
      this.gl.activeTexture(this.gl.TEXTURE0 + textureIndex);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture.glTexture);
      this.gl.uniform1i(location, textureIndex);
    }
  }

  public setBuffer(buffer: WebGLBuffer, values: vec3[]) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(values.flat() as number[]), this.gl.STATIC_DRAW);
  }

  public setIndices(values: number[]) {
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
    const indicesArray = new Uint16Array(values);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indicesArray, this.gl.STATIC_DRAW);
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
  public recompile() {
    this.destroy();
    this.initialize();
  }

  public destroy() {
    if (this.buffers.position)
      this.gl.deleteBuffer(this.buffers.position);

    if (this.buffers.normal)
      this.gl.deleteBuffer(this.buffers.normal);

    if (this.buffers.uv)
      this.gl.deleteBuffer(this.buffers.uv);

    if (this.buffers.indices)
      this.gl.deleteBuffer(this.buffers.indices);

    if (this.shaderProgram)
      this.gl.deleteProgram(this.shaderProgram);
    this.initialized = false;
  }
}
