import { Shader, ShaderUniformsEnum } from 'omega-game-engine';

export class PlaneHelper {
  private gl: WebGL2RenderingContext;
  private positionBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  private lineIndexBuffer: WebGLBuffer | null = null;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.init();
  }

  private init() {
    const verts = [];
    const indices = [];
    const lineIndices = [];

    // Create a 3x3 grid to give the plane "tones" and structure
    const divisions = 3;
    for (let i = 0; i <= divisions; i++) {
      for (let j = 0; j <= divisions; j++) {
        verts.push(i / divisions, j / divisions, 0.0);
      }
    }

    for (let i = 0; i < divisions; i++) {
      for (let j = 0; j < divisions; j++) {
        const row1 = i * (divisions + 1);
        const row2 = (i + 1) * (divisions + 1);

        const a = row1 + j;
        const b = row1 + j + 1;
        const c = row2 + j + 1;
        const d = row2 + j;

        // Solid Quads
        indices.push(a, b, c, a, c, d);
        // Structural Grid Lines
        lineIndices.push(a, b, b, c, c, d, d, a);
      }
    }

    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(verts),
      this.gl.STATIC_DRAW,
    );

    this.indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      this.gl.STATIC_DRAW,
    );

    this.lineIndexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.lineIndexBuffer);
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(lineIndices),
      this.gl.STATIC_DRAW,
    );
  }

  // Draws the fully highlighted plane
  public drawSolid(shader: Shader) {
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
    this.gl.drawElements(this.gl.TRIANGLES, 54, this.gl.UNSIGNED_SHORT, 0);

    this.gl.disableVertexAttribArray(posLoc);
  }

  // Draws the internal structure
  public drawLines(shader: Shader) {
    if (!shader._shaderProgram) return;
    const posLoc = this.gl.getAttribLocation(
      shader._shaderProgram,
      ShaderUniformsEnum.A_POSITION,
    );
    if (posLoc === -1) return;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(posLoc, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(posLoc);

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.lineIndexBuffer);
    this.gl.drawElements(this.gl.LINES, 72, this.gl.UNSIGNED_SHORT, 0);

    this.gl.disableVertexAttribArray(posLoc);
  }
}
