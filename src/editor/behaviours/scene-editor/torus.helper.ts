import { Shader, ShaderUniformsEnum } from "@engine";

export class TorusHelper {
  private gl: WebGL2RenderingContext;
  private positionBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  private indexCount = 0;

  constructor(gl: WebGL2RenderingContext, radius = 1.0, tubeRadius = 0.02, radialSegments = 64, tubularSegments = 16) {
    this.gl = gl;
    this.init(radius, tubeRadius, radialSegments, tubularSegments);
  }

  private init(radius: number, tube: number, radialSegments: number, tubularSegments: number) {
    const vertices = [];
    const indices = [];

    // Generate Torus Vertices
    for (let j = 0; j <= radialSegments; j++) {
      for (let i = 0; i <= tubularSegments; i++) {
        const u = (i / tubularSegments) * Math.PI * 2;
        const v = (j / radialSegments) * Math.PI * 2;

        const x = (radius + tube * Math.cos(u)) * Math.cos(v);
        const y = (radius + tube * Math.cos(u)) * Math.sin(v);
        const z = tube * Math.sin(u);

        vertices.push(x, y, z);
      }
    }

    // Generate Torus Indices
    for (let j = 1; j <= radialSegments; j++) {
      for (let i = 1; i <= tubularSegments; i++) {
        const a = (tubularSegments + 1) * j + i - 1;
        const b = (tubularSegments + 1) * (j - 1) + i - 1;
        const c = (tubularSegments + 1) * (j - 1) + i;
        const d = (tubularSegments + 1) * j + i;

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    this.indexCount = indices.length;

    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

    this.indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);
  }

  public draw(shader: Shader) {
    if (!shader._shaderProgram) return;
    const posLoc = this.gl.getAttribLocation(shader._shaderProgram, ShaderUniformsEnum.A_POSITION);
    if (posLoc === -1) return;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(posLoc, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(posLoc);

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.drawElements(this.gl.TRIANGLES, this.indexCount, this.gl.UNSIGNED_SHORT, 0);

    this.gl.disableVertexAttribArray(posLoc);
  }
}