import { Camera } from "@engine/entities/camera";
import { ShaderUniformsEnum } from "@engine/enums/shader-uniforms.enum";
import { mat4 } from "gl-matrix";
import { RenderMeshBehaviour } from "./render-mesh-behaviour";
import { JsonSerializedData } from "@engine/interfaces/json-serialized-data";

export class SkyboxRenderer extends RenderMeshBehaviour {

  static override instanciate(gl: WebGL2RenderingContext): SkyboxRenderer {
    return new SkyboxRenderer(gl);
  }

  override initialize(): boolean {
    if (super.initialize()) {
      this.transform.setPosition(0, 0, 0);
      this.transform.setScale(1000, 1000, 1000);
      return true;
    }
    return false;
  }

  protected override setGlSettings(): void {
    this.gl.cullFace(this.gl.FRONT);
    this.gl.depthFunc(this.gl.LEQUAL);
  }

  override draw(): void {
    if (!this.mesh || !this.shader.shaderProgram) { return }

    this.shader.bindBuffers();
    this.shader.use();
    this.setShaderVariables();
    this.gl.drawElements(this.gl.TRIANGLES, this.mesh.meshData.indices.length, this.gl.UNSIGNED_SHORT, 0);
  }

  override setCameraMatrices() {
    const camera = Camera.mainCamera;

    // Create a view matrix without translation
    const viewMatrixNoTranslation = mat4.clone(camera.viewMatrix);
    // Zero out the translation components (indices 12, 13, 14 for column-major gl-matrix)
    viewMatrixNoTranslation[12] = 0;
    viewMatrixNoTranslation[13] = 0;
    viewMatrixNoTranslation[14] = 0;

    const mvpMatrix = mat4.create();
    this.transform.updateModelMatrix();
    mat4.multiply(mvpMatrix, camera.projectionMatrix, camera.viewMatrix);
    mat4.multiply(mvpMatrix, mvpMatrix, this.parent.transform.modelMatrix);
    this.shader.setMat4(ShaderUniformsEnum.U_MVP_MATRIX, mvpMatrix);
  }

  override setShaderVariables() {
    this.setGlSettings();
    this.setCameraMatrices();
    this.shader.loadDataIntoShader();
  }


  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
  }
}
