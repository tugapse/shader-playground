import { mat4, vec2, vec3, vec4, mat3 } from "gl-matrix"; // Added mat3 import
import { Material } from "../materials/material";
import { Texture } from "../materials/texture";
import { ShaderUniformsEnum } from "../enums/shader-uniforms";
import { ColorMaterial } from "../materials/color-material";
import { MeshData } from "@engine/core/mesh";

// New: Extend WebGLBuffers to include tangent and bitangent buffers
export interface WebGLBuffers {
  position: WebGLBuffer | null;
  normal: WebGLBuffer | null;
  uv: WebGLBuffer | null;
  tangent: WebGLBuffer | null; // <--- New
  bitangent: WebGLBuffer | null; // <--- New
  indices: WebGLBuffer | null;
}

export class Shader {

  public shaderProgram!: WebGLProgram;
  private initialized = false;
  // Initialize with the new buffers
  public buffers: WebGLBuffers = {
    position: null,
    normal: null,
    uv: null,
    tangent: null, // <--- New
    bitangent: null, // <--- New
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
    mesh.calculateTangentsAndBitangents();
    // New: The buffers interface now includes tangent and bitangent
    const buffers: WebGLBuffers = {
      position: null,
      normal: null,
      uv: null,
      tangent: null, // Initialize as null
      bitangent: null, // Initialize as null
      indices: null,
    };

    // --- Position Buffer ---
    buffers.position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    const positions: number[] = [];
    for (const v of mesh.vertices) {
      positions.push(v[0], v[1], v[2]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // --- Normal Buffer ---
    buffers.normal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    const normals: number[] = [];
    for (const n of mesh.normals) {
      normals.push(n[0], n[1], n[2]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    // --- UV Buffer ---
    buffers.uv = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uv);
    const uvs: number[] = [];
    for (const uv of mesh.uvs) {
      uvs.push(uv[0], uv[1]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);

    // --- New: Tangent Buffer ---
    if (mesh.tangents && mesh.tangents.length > 0) { // Check if tangents exist and are not empty
        buffers.tangent = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.tangent);
        const tangents: number[] = [];
        for (const t of mesh.tangents) {
            tangents.push(t[0], t[1], t[2]);
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tangents), gl.STATIC_DRAW);
    }

    // --- New: Bitangent Buffer ---
    if (mesh.bitangents && mesh.bitangents.length > 0) { // Check if bitangents exist and are not empty
        buffers.bitangent = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.bitangent);
        const bitangents: number[] = [];
        for (const b of mesh.bitangents) {
            bitangents.push(b[0], b[1], b[2]);
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bitangents), gl.STATIC_DRAW);
    }

    // --- Index Buffer ---
    buffers.indices = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);

    this.buffers = buffers; // Assign the newly created buffers to the class property
  }

  public bindBuffers() {
    if (!this.gl || !this.shaderProgram) return;
    // Position Attribute
    const positionAttributeLocation = this.gl.getAttribLocation(this.shaderProgram, 'a_position');
    if (this.buffers.position && positionAttributeLocation !== -1) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
        this.gl.vertexAttribPointer(positionAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(positionAttributeLocation);
    } else if (positionAttributeLocation !== -1) {
        // If buffer is null but location is valid, disable it to prevent errors
        this.gl.disableVertexAttribArray(positionAttributeLocation);
    }


    // Normal Attribute
    const normalAttributeLocation = this.gl.getAttribLocation(this.shaderProgram, 'a_normal');
    if (this.buffers.normal && normalAttributeLocation !== -1) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.normal);
        this.gl.vertexAttribPointer(normalAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(normalAttributeLocation);
    } else if (normalAttributeLocation !== -1) {
        this.gl.disableVertexAttribArray(normalAttributeLocation);
    }

    // UV Attribute
    const uvAttributeLocation = this.gl.getAttribLocation(this.shaderProgram, 'a_uv');
    if (this.buffers.uv && uvAttributeLocation !== -1) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.uv);
        this.gl.vertexAttribPointer(uvAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(uvAttributeLocation);
    } else if (uvAttributeLocation !== -1) {
        this.gl.disableVertexAttribArray(uvAttributeLocation);
    }

    // New: Tangent Attribute
    const tangentAttributeLocation = this.gl.getAttribLocation(this.shaderProgram, 'a_tangent');
    if (this.buffers.tangent && tangentAttributeLocation !== -1) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.tangent);
        this.gl.vertexAttribPointer(tangentAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(tangentAttributeLocation);
    } else if (tangentAttributeLocation !== -1) { // Only disable if the attribute exists in the shader
       console.debug("Tagent arrtibute location not found")
        this.gl.disableVertexAttribArray(tangentAttributeLocation);
    }

    // New: Bitangent Attribute
    const bitangentAttributeLocation = this.gl.getAttribLocation(this.shaderProgram, 'a_bitangent');
    if (this.buffers.bitangent && bitangentAttributeLocation !== -1) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.bitangent);
        this.gl.vertexAttribPointer(bitangentAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(bitangentAttributeLocation);
    } else if (bitangentAttributeLocation !== -1) { // Only disable if the attribute exists in the shader
        console.debug("BiTagent arrtibute location not found")
        this.gl.disableVertexAttribArray(bitangentAttributeLocation);
    }

    // Bind Index Buffer for Drawing
    if (this.buffers.indices) {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
    }
  }

  public use() {
    if (!this.shaderProgram || !this.initialized) {
      return;
    }
    this.gl.useProgram(this.shaderProgram);
  }

  public loadDataIntoShader() {
    const material = this.material as ColorMaterial; // Assuming ColorMaterial is base or compatible
    this.setVec4(ShaderUniformsEnum.U_MAT_COLOR, material.color);
  }

  public setMat4(name:string, value: mat4): void {
    const location = this.gl.getUniformLocation(this.shaderProgram, name);
    if (location) {
      this.gl.uniformMatrix4fv(location, false, value);
    } else {
      console.warn(`Uniform location for ${name} not found or is null.`);
    }
  }

  // New: A helper function for setting mat3 uniforms
  public setMat3(name: string, value: mat3): void {
    const location = this.gl.getUniformLocation(this.shaderProgram, name);
    if (location) {
      this.gl.uniformMatrix3fv(location, false, value);
    } else {
      console.warn(`Uniform location for ${name} not found or is null.`);
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
    } else {
        console.warn(`Texture uniform location for ${name} not found or is null.`);
    }
  }

  public setBuffer(buffer: WebGLBuffer, values: vec3[]) { // This method seems to be generic; ensure it handles flat arrays for `bufferData`
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

    // New: Delete tangent and bitangent buffers
    if (this.buffers.tangent)
        this.gl.deleteBuffer(this.buffers.tangent);

    if (this.buffers.bitangent)
        this.gl.deleteBuffer(this.buffers.bitangent);

    if (this.buffers.indices)
      this.gl.deleteBuffer(this.buffers.indices);

    if (this.shaderProgram)
      this.gl.deleteProgram(this.shaderProgram);
    this.initialized = false;
  }
}
