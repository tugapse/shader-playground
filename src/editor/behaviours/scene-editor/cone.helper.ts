import { mat4, vec3 } from "gl-matrix";
import { Color, ColorMaterial, Shader, ShaderUniformsEnum } from "@engine";

export class ConeHelper {
    private vertexBuffer: WebGLBuffer;
    private indexBuffer: WebGLBuffer;
    private indexCount: number;

    constructor(private _gl: WebGL2RenderingContext) {
        const { vertices, indices } = this.createConeGeometry();
        this.indexCount = indices.length;

        this.vertexBuffer = this._gl.createBuffer()!;
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.vertexBuffer);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(vertices), this._gl.STATIC_DRAW);

        this.indexBuffer = this._gl.createBuffer()!;
        this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this._gl.STATIC_DRAW);
    }

    private createConeGeometry(radius = 0.1, height = 0.3, segments = 16) {
        const vertices: number[] = [0, height, 0]; // Tip of the cone
        const indices: number[] = [];

        // Base vertices
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * 2 * Math.PI;
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            vertices.push(x, 0, z);
        }
        vertices.push(0, 0, 0); // Center of the base
        const baseCenterIndex = segments + 1;

        // Cone sides and base indices
        for (let i = 0; i < segments; i++) {
            indices.push(0, i + 1, ((i + 1) % segments) + 1);
            indices.push(baseCenterIndex, ((i + 1) % segments) + 1, i + 1);
        }

        return { vertices, indices };
    }

    public draw(shader: Shader) {
        if (!shader?._shaderProgram) return;

        shader.use();

        const positionAttributeLocation = this._gl.getAttribLocation(shader._shaderProgram, ShaderUniformsEnum.A_POSITION);
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.vertexBuffer);
        this._gl.vertexAttribPointer(positionAttributeLocation, 3, this._gl.FLOAT, false, 0, 0);
        this._gl.enableVertexAttribArray(positionAttributeLocation);

        this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        shader.loadDataIntoShader();

        this._gl.drawElements(this._gl.TRIANGLES, this.indexCount, this._gl.UNSIGNED_SHORT, 0);

        this._gl.disableVertexAttribArray(positionAttributeLocation);
    }
}
