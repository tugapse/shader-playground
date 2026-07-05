import { mat4, vec3 } from 'gl-matrix';
import { Shader, ShaderUniformsEnum } from 'omega-game-engine';

export class PlanarQuadHelper {
  private gl: WebGL2RenderingContext;
  private positionBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.init();
  }

  private init() {
    // Draws a solid L-shaped quad bracket
    const vertices = new Float32Array([
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      1.0,
      0.2,
      0.0,
      0.0,
      0.2,
      0.0, // Base Bar
      0.0,
      0.0,
      0.0,
      0.2,
      0.0,
      0.0,
      0.2,
      1.0,
      0.0,
      0.0,
      1.0,
      0.0, // Side Bar
    ]);

    const indices = new Uint16Array([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);

    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    this.indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      indices,
      this.gl.STATIC_DRAW,
    );
  }

  public draw(shader: Shader) {
    if (!shader._shaderProgram) return;
    const posLoc = this.gl.getAttribLocation(
      shader._shaderProgram,
      ShaderUniformsEnum.A_POSITION,
    );
    if (posLoc === -1) return;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(posLoc, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(posLoc);

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.drawElements(this.gl.TRIANGLES, 12, this.gl.UNSIGNED_SHORT, 0);

    this.gl.disableVertexAttribArray(posLoc);
  }
}
