import { Texture } from "../textures";
import { Scene } from "../entities/scene";
import { mat4, vec3 } from "gl-matrix";
import { Transform } from "./transform";
import { RendererBehaviour } from "../behaviours";
import { CullFace, ShaderUniformsEnum } from "../enums";
import { Camera, DirectionalLight, GlEntity, Light } from "../entities";
import { CanvasViewport } from "./canvas-viewport";
import { Shader } from "../shaders";
import { ColorMaterial } from "../materials";
import { NumberRange } from "./range";

/**
 * A specialized renderer responsible for creating a shadow map.
 * This renderer performs a depth-only pass from the perspective of a light source,
 * rendering all shadow-casting objects in the scene to a depth texture.
 * This depth texture (the shadow map) is then used by other renderers to apply shadows.
 */
export class ShadowMapRenderer {


  /**
   * The depth texture that stores the shadow map.
   * @public
   * @type {Texture}
   */
  public shadowmapTexture: Texture;
  /**
   * The resolution (width and height) of the shadow map texture.
   * Higher values produce sharper shadows but are more performance-intensive.
   * @public
   * @static
   * @type {number}
   */
  public static shadowMapSize = 2096;
  /**
   * The framebuffer object used for rendering to the shadow map texture.
   * @protected
   * @type {WebGLFramebuffer}
   */
  protected framebuffer!: WebGLFramebuffer;
  public scene: Scene;

  /**
   * A dedicated shader used for the depth-only rendering pass.
   * @private
   * @type {Shader}
   */
  private depthShader: Shader;

  /**
   * Indicates whether shadow mapping is currently enabled.
   * @public
   * @type {boolean}
   */
  public enabled: boolean = true;
  public shadowstrength = new NumberRange(0.2,0.0,0.9,0.001)

  /**
   * Creates an instance of ShadowMapRenderer.
   * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
   */
  constructor(public gl: WebGL2RenderingContext, scene: Scene) {
    this.scene = scene;

    // Create the texture to be used as the shadow map
    this.shadowmapTexture = Texture.createDepthTexture(this.gl, ShadowMapRenderer.shadowMapSize, ShadowMapRenderer.shadowMapSize);
    this.shadowmapTexture.name = "ShadowmapTexture";


    // Configure the depth texture for shadow mapping (hardware PCF).
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.shadowmapTexture.glTexture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_COMPARE_MODE, this.gl.COMPARE_REF_TO_TEXTURE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_COMPARE_FUNC, this.gl.LEQUAL);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);

    this.depthShader = new Shader(gl, new ColorMaterial(),
      "assets/shaders/frag/depth-only.frag",
      "assets/shaders/vertex/shadow-caster.vert"
    );
    this.depthShader.initialize();

  }



  /**
   * Renders all shadow-casting objects from the light's perspective into the shadow map.
   * This method is called automatically by the rendering pipeline.
   * @override
   * @returns {void}
   */
  drawShadowapTexture(lightEntity: DirectionalLight): void {
    if (!this.shadowmapTexture.glTexture || !this.depthShader._shaderProgram) return;

    // Begin the off-screen render pass to the shadow map texture.
    this.startPass(this.shadowmapTexture.glTexture!, this.shadowmapTexture.width, this.shadowmapTexture.height);

    // Use the dedicated depth shader for this pass.
    this.depthShader.use();

    const shadowCasters = this.scene.objects.filter(obj => (
      obj.active && obj.show &&
      obj.getBehaviour(RendererBehaviour)?.castShadows));

   for (const entity of shadowCasters) {
    const renderer = entity.getBehaviour(RendererBehaviour);
    if (!renderer || !renderer.shader) continue;
 
    const orgCulling = renderer.cullFace;
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);

    const positionAttributeLocation = this.gl.getAttribLocation(this.depthShader._shaderProgram, ShaderUniformsEnum.A_POSITION);
    if (positionAttributeLocation !== -1 && renderer.shader.buffers.position) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer.shader.buffers.position);
    this.gl.vertexAttribPointer(positionAttributeLocation, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(positionAttributeLocation);
    }

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, renderer.shader.buffers.indices);

    const { lightMvpMatrix } = renderer.createLightMatrices(Camera.mainCamera.transform, lightEntity);

    this.setMatrices(entity.transform, lightMvpMatrix);

    this.gl.drawElements(
        WebGL2RenderingContext.TRIANGLES,
        renderer.mesh.meshData.indices.length,
        this.gl.UNSIGNED_SHORT,
        0
    );

    this.gl.cullFace(orgCulling);

    if (positionAttributeLocation !== -1) {
    this.gl.disableVertexAttribArray(positionAttributeLocation);
    }
}

    // End the render pass, unbinding the framebuffer and restoring the default state.
    this.endPass();
  }

  endPass() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, CanvasViewport.rendererWidth, CanvasViewport.rendererHeight);
    this.shadowmapTexture.unBind();
    this.depthShader.release();
  }

/**
   * Sets the model-view-projection matrix for a given object from the light's perspective.
   * @param {Transform} entityTransform - The transform of the object to be rendered.
   * @protected
   */
setMatrices(entityTransform: Transform, lightMvpMatrix: mat4) {
    if (this.depthShader) {
      const modelLightMvpMatrix = mat4.create();
      // Multiply Light View-Projection (lightMvpMatrix) by the object's World Matrix
      mat4.multiply(modelLightMvpMatrix, lightMvpMatrix, entityTransform.modelMatrix);
      
      // Send the combined Light-Space MVP directly to the uniform
      this.depthShader.setMat4(ShaderUniformsEnum.U_MODEL_MATRIX, modelLightMvpMatrix);
    }
  }

  /**
   * Starts the depth-only rendering pass to the shadow map texture.
   * @param {WebGLTexture} texture - The depth texture to render to.
   * @param {number} width - The width of the render target.
   * @param {number} height - The height of the render target.
   * @override
   */
  startPass(texture: WebGLTexture, width: number, height: number): void {
    const gl = this.gl;
    if (!this.framebuffer) {
      this.framebuffer = gl.createFramebuffer();
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.TEXTURE_2D,
      texture,
      0
    );

    // Tell WebGL we are not writing to any color buffers for this pass
    gl.drawBuffers([gl.NONE]);

    // Clear only the depth buffer
    gl.viewport(0, 0, width, height);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
  }

  destroy() {
    this.shadowmapTexture.destroy();
    this.depthShader.destroy();
    if (this.framebuffer) {
      this.gl.deleteFramebuffer(this.framebuffer);
    }
  }

  clearShadowMap() {
    if (!this.shadowmapTexture.glTexture) return;
    this.startPass(this.shadowmapTexture.glTexture!, this.shadowmapTexture.width, this.shadowmapTexture.height);
    this.endPass();
  }
}
