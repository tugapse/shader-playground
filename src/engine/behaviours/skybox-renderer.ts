import { Camera } from "@engine/entities/camera";
import { EntityBehaviour } from "./entity-behaviour";
import { RenderMeshBehaviour } from "./render-mesh-behaviour";
import { UnlitMaterial } from "@engine/materials/unlit-material";
import { mat4 } from "gl-matrix";
import { ShaderUniformsEnum } from "@engine/enums/shader-uniforms.enum";

export class SkyboxRenderer extends RenderMeshBehaviour {

  override initialize(): void {

    // TODO usar projeçao ortho para o skybox
    this.shader.fragUri = "assets/shaders/frag/skybox.glsl";
    this.shader.vertexUri = "assets/shaders/vertex/vertex.glsl";
    const material = this.material as UnlitMaterial;
    material.mainTexUrl = "assets/images/skybox/test.jpg"
    super.initialize()
    this.transform.setPosition(0, 0, 0);
    this.transform.setScale(1000, 1000, 1000);
  }
  protected override setGlSettings(): void {
    this.gl.cullFace(this.gl.FRONT);
    this.gl.depthFunc(this.gl.LESS);
  }

  override draw(): void {
    super.draw();
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

}
