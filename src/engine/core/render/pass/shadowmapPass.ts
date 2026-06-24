import { Scene, DirectionalLight, Camera } from '@engine/entities';
import { Shader } from '@engine/shaders';
import { Texture } from '@engine/textures';
import { RendererBehaviour } from '@engine/behaviours';
import { mat4 } from 'gl-matrix';
import { IRenderPass } from './render-pass.interface';
import { ShaderUniformsEnum } from '@engine/enums/shader-uniforms.enum';
import { NumberRange } from '../../range';
import { JsonSerializable } from '../../json-serializable';
import { JsonSerializedData } from '@engine/interfaces';

export class ShadowMapPass extends JsonSerializable implements IRenderPass {
  private gl: WebGL2RenderingContext;
  private depthShader: Shader;
  private framebuffer!: WebGLFramebuffer | null;

  public shadowstrength: NumberRange = new NumberRange(0.4, 0.0, 1.0, 0.0001);
  public shadowmapTexture: Texture;
  public static shadowMapSize = 4096;
  public enabled = true;

  constructor(gl: WebGL2RenderingContext) {
    super('ShadowMapPass');
    this.gl = gl;

    // 1. Initialize self-contained Depth Texture
    this.shadowmapTexture = Texture.createDepthTexture(
      this.gl,
      ShadowMapPass.shadowMapSize,
      ShadowMapPass.shadowMapSize,
    );
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.shadowmapTexture.glTexture);
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_COMPARE_MODE,
      this.gl.COMPARE_REF_TO_TEXTURE,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_COMPARE_FUNC,
      this.gl.LEQUAL,
    );
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);

    // 2. Dedicated lightweight depth shader
    this.depthShader = new Shader(
      gl,
      null as any,
      'assets/shaders/frag/depth-only.frag',
      'assets/shaders/vertex/shadow-caster.vert',
    );
    this.depthShader.initialize();
  }

  setGl(gl: WebGL2RenderingContext): void {
    this.gl = gl;
  }

  private getOrCreateFramebuffer(): WebGLFramebuffer {
    if (!this.framebuffer) {
      this.framebuffer = this.gl.createFramebuffer();
    }
    return this.framebuffer!;
  }

  public initialize(): void {
    if (!this.framebuffer) {
      this.framebuffer = this.gl.createFramebuffer();
    }
  }

  public execute(scene: Scene): void {
    if (
      !this.enabled ||
      !this.shadowmapTexture.glTexture ||
      !this.depthShader._shaderProgram
    ) {
      this.clearShadowMap();
      return;
    }

    const lightEntity = scene.lights.find(
      (obj) =>
        obj.entityType === 1 /* EntityType.LIGHT_DIRECTIONAL */ &&
        obj.active &&
        obj.show,
    ) as DirectionalLight | undefined;

    if (!lightEntity) {
      this.clearShadowMap();
      return;
    }

    // --- Off-screen Light Pass Start ---
    const fb = this.getOrCreateFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.DEPTH_ATTACHMENT,
      this.gl.TEXTURE_2D,
      this.shadowmapTexture.glTexture,
      0,
    );
    this.gl.drawBuffers([this.gl.NONE]);

    const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
    if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
      console.error('ShadowMapPass: Framebuffer incomplete, status:', status);
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      return;
    }

    this.gl.viewport(
      0,
      0,
      this.shadowmapTexture.width,
      this.shadowmapTexture.height,
    );
    this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LESS);

    this.depthShader.use();

    // Loop through casters directly
    const shadowCasters = scene.objects.filter(
      (obj) =>
        obj.active &&
        obj.show &&
        obj.getBehaviour(RendererBehaviour)?.castShadows,
    );

    for (const entity of shadowCasters) {
      const renderer = entity.getBehaviour(RendererBehaviour);
      if (!renderer || !renderer.shader) continue;

      this.gl.enable(this.gl.CULL_FACE);
      this.gl.cullFace(this.gl.FRONT); // Cull front faces for depth map to prevent acne

      const posLoc = this.gl.getAttribLocation(
        this.depthShader._shaderProgram,
        ShaderUniformsEnum.A_POSITION,
      );
      if (posLoc !== -1 && renderer.shader.buffers.position) {
        this.gl.bindBuffer(
          this.gl.ARRAY_BUFFER,
          renderer.shader.buffers.position,
        );
        this.gl.vertexAttribPointer(posLoc, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(posLoc);
      }

      this.gl.bindBuffer(
        this.gl.ELEMENT_ARRAY_BUFFER,
        renderer.shader.buffers.indices,
      );

      // Recalculate Light MVP matrices per entity using lightweight function
      const { lightMvpMatrix } = renderer.createLightMatrices(
        Camera.mainCamera.transform,
        lightEntity,
      );
      
      const modelLightMvpMatrix = mat4.create();
      mat4.multiply(
        modelLightMvpMatrix,
        lightMvpMatrix,
        entity.transform.modelMatrix,
      );

      this.depthShader.setMat4(
        ShaderUniformsEnum.U_MODEL_MATRIX, // Matches u_modelMatrix in shadow-caster.vert
        modelLightMvpMatrix,
      );
      this.depthShader.loadDataIntoShader();

      this.gl.drawElements(
        WebGL2RenderingContext.TRIANGLES,
        renderer.mesh.meshData.indices.length,
        this.gl.UNSIGNED_SHORT,
        0,
      );

      if (posLoc !== -1) this.gl.disableVertexAttribArray(posLoc);
    }

    // --- Cleanup Pass ---
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.depthShader.release();
  }

  public clearShadowMap(): void {
    const fb = this.getOrCreateFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.DEPTH_ATTACHMENT,
      this.gl.TEXTURE_2D,
      this.shadowmapTexture.glTexture,
      0,
    );
    this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  public cleanup(): void {
    this.shadowmapTexture.destroy();
    this.depthShader.destroy();
    if (this.framebuffer) this.gl.deleteFramebuffer(this.framebuffer);
  }

  public resize(width: number, height: number): void {}

  public override toJsonObject(): JsonSerializedData {
    return this.serializeAutomatically();
  }
  
  public override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.deserializeAutomatically(jsonObject);
  }
}