import { mat4, vec3 } from "gl-matrix";
import { Camera, Color, ColorMaterial, Mesh, MeshData, Shader, ShaderUniformsEnum } from "@engine";

export class ConeHelper {
  public mesh!: Mesh;

  constructor(private _gl: WebGL2RenderingContext, private shader: Shader, private pickingShader: Shader) {
    this.createMesh();
    this.initialize();
  }

  private initialize() {
    this.shader.initBuffers(this._gl, this.mesh.meshData);
    this.pickingShader.initBuffers(this._gl, this.mesh.meshData);
  }

  private bind(shader: Shader) {
    shader.bindBuffers();
  }
  private createMesh(radius = 0.1, height = 0.3, segments = 16): void {
    const vertices: vec3[] = [];
    const indices: number[] = [];

    // Tip of the cone
    vertices.push(vec3.fromValues(0, height, 0));

    // Base vertices
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      vertices.push(vec3.fromValues(x, 0, z));
    }

    // Center of the base
    vertices.push(vec3.fromValues(0, 0, 0));
    const baseCenterIndex = segments + 1;

    // Cone sides
    for (let i = 0; i < segments; i++) {
      indices.push(0, i + 1, ((i + 1) % segments) + 1);
    }

    // Cone base
    for (let i = 0; i < segments; i++) {
      indices.push(baseCenterIndex, ((i + 1) % segments) + 1, i + 1);
    }

    this.mesh = new Mesh();
    this.mesh.meshData = new MeshData(vertices, [], [], indices);
  }

  public draw(transformMatrix: mat4, color: Color, shader: Shader) {
    if (!shader?._shaderProgram) return;

    shader.use();
    this.bind(shader);
    // Set color
    (shader.material as ColorMaterial).color.set(...color.toVec4());

    this._gl.drawElements(this._gl.TRIANGLES, this.mesh.meshData.indices.length, this._gl.UNSIGNED_SHORT, 0);
  }
}
