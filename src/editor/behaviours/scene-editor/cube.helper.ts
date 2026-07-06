import { mat4, vec3 } from 'gl-matrix';
import {
  Mesh,
  Shader,
  MeshData,
  Color,
  ColorMaterial,
} from 'omega-game-engine';

export class CubeHelper {
  public mesh!: Mesh;

  constructor(
    private _gl: WebGL2RenderingContext,
    private shader: Shader,
    private pickingShader: Shader,
  ) {
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

  private createMesh(size = 0.2): void {
    const halfSize = size / 2;
    const vertices: vec3[] = [
      // Front face
      vec3.fromValues(-halfSize, -halfSize, halfSize),
      vec3.fromValues(halfSize, -halfSize, halfSize),
      vec3.fromValues(halfSize, halfSize, halfSize),
      vec3.fromValues(-halfSize, halfSize, halfSize),
      // Back face
      vec3.fromValues(-halfSize, -halfSize, -halfSize),
      vec3.fromValues(-halfSize, halfSize, -halfSize),
      vec3.fromValues(halfSize, halfSize, -halfSize),
      vec3.fromValues(halfSize, -halfSize, -halfSize),
    ];

    const indices: number[] = [
      0,
      1,
      2,
      0,
      2,
      3, // front
      4,
      5,
      6,
      4,
      6,
      7, // back
      3,
      2,
      6,
      3,
      6,
      5, // top
      0,
      4,
      7,
      0,
      7,
      1, // bottom
      1,
      7,
      6,
      1,
      6,
      2, // right
      0,
      3,
      5,
      0,
      5,
      4, // left
    ];

    this.mesh = new Mesh();
    this.mesh.meshData = new MeshData(vertices, [], [], indices);
  }

  public draw(transformMatrix: mat4, color: Color, shader: Shader) {
    if (!shader?._shaderProgram) return;

    shader.use();
    this.bind(shader);
    // Set color
    (shader.material as ColorMaterial).color.set(...color.toVec4());

    this._gl.drawElements(
      this._gl.TRIANGLES,
      this.mesh.meshData.indices.length,
      this._gl.UNSIGNED_SHORT,
      0,
    );
  }
}
