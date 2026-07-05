import { Shader, ShaderUniformsEnum } from 'omega-game-engine';

export class CircleHelper {
  private vertexBuffer: WebGLBuffer;
  private indexBuffer: WebGLBuffer;
  private indexCount: number;

  constructor(private _gl: WebGL2RenderingContext) {
    const { vertices, indices } = this.createCircleGeometry();
    this.indexCount = indices.length;

    this.vertexBuffer = this._gl.createBuffer()!;
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.vertexBuffer);
    this._gl.bufferData(
      this._gl.ARRAY_BUFFER,
      new Float32Array(vertices),
      this._gl.STATIC_DRAW,
    );

    this.indexBuffer = this._gl.createBuffer()!;
    this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this._gl.bufferData(
      this._gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      this._gl.STATIC_DRAW,
    );
  }

  private createCircleGeometry(radius = 1.0, segments = 64) {
    const vertices: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      vertices.push(x, y, 0);
      indices.push(i);
    }
    return { vertices, indices };
  }

  public draw(
    shader: Shader,
    pointSize: number = 1.0,
    asPoints: boolean = false,
  ) {
    if (!shader?._shaderProgram) return;

    shader.use();

    // Bind buffers and set attributes
    const positionAttributeLocation = this._gl.getAttribLocation(
      shader._shaderProgram,
      ShaderUniformsEnum.A_POSITION,
    );
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.vertexBuffer);
    this._gl.vertexAttribPointer(
      positionAttributeLocation,
      3,
      this._gl.FLOAT,
      false,
      0,
      0,
    );
    this._gl.enableVertexAttribArray(positionAttributeLocation);

    this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    // Set uniforms
    shader.loadDataIntoShader();

    if (asPoints) {
      shader.setFloat('u_pointSize', pointSize);
      this._gl.drawElements(
        this._gl.POINTS,
        this.indexCount,
        this._gl.UNSIGNED_SHORT,
        0,
      );
    } else {
      this._gl.drawElements(
        this._gl.LINE_LOOP,
        this.indexCount,
        this._gl.UNSIGNED_SHORT,
        0,
      );
    }

    // Clean up
    this._gl.disableVertexAttribArray(positionAttributeLocation);
  }

  public destroy() {
    this._gl.deleteBuffer(this.vertexBuffer);
    this._gl.deleteBuffer(this.indexBuffer);
  }
}
