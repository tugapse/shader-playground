import { mat4 } from "gl-matrix";
import { Camera, ColorMaterial, CullFace, DephFunction, MeshData, RendererBehaviour, RenderLayer, Shader, ShaderUniformsEnum, Texture, Transform } from "omega-game-engine";
import { TexturedRendererBehaviour } from "./renderer";
import { ShadowCasterRenderer } from "./shadow-renderer";

export class ShadowMapRenderer extends TexturedRendererBehaviour {

  public shadowmapTexture: Texture;
  public static shadowMapSize = 2048;
  protected framebuffer!: WebGLFramebuffer;

  // A dedicated shader for the depth-only pass
  private depthShader: Shader;

  constructor(gl: WebGL2RenderingContext) {
    super(gl);
    this.name = "ShadowMap Renderer";
    this.renderLayer = RenderLayer.PRE_SCENE;
    this.cullFace = CullFace.FRONT;
    this.dephMode = DephFunction.Less;

    // Create the texture to be used as the shadow map
    this.shadowmapTexture = Texture.createDepthTexture(this._gl, ShadowMapRenderer.shadowMapSize, ShadowMapRenderer.shadowMapSize);
    this.shadowmapTexture.name = "Shadowmap Texture";

    // Set the texture to use hardware-based comparison for shadow mapping
    this._gl.bindTexture(this._gl.TEXTURE_2D, this.shadowmapTexture.glTexture);
    this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_COMPARE_MODE, this._gl.COMPARE_REF_TO_TEXTURE);
    this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_COMPARE_FUNC, this._gl.LEQUAL);
    this._gl.bindTexture(this._gl.TEXTURE_2D, null);

    this.depthShader = new Shader(gl, new ColorMaterial(),
      "assets/shaders/frag/depth-only.frag",
      "assets/shaders/vertex/shadow-caster.vert"
    );
    this.depthShader.initialize();

    // The renderer itself doesn't have a mesh to draw
    this.mesh.meshData = new MeshData([]);
  }

  override draw(): void {
    if (!this.shadowmapTexture.glTexture || !this.depthShader._shaderProgram) return;

    // This is where you pass the generated texture to the main scene's renderers
    this.parent.scene.shadowMap = this.shadowmapTexture;

    // Begin the off-screen render pass to the shadow map texture
    this.startPass(this.shadowmapTexture.glTexture, ShadowMapRenderer.shadowMapSize, ShadowMapRenderer.shadowMapSize);

    // Use the dedicated depth shader for this entire pass
    this.depthShader.use();

    const objs = this.parent.scene.objects.filter(ob => (
      ob.active && ob.show &&
      ob.getBehaviour(ShadowCasterRenderer)?.castShadows));

    for (const oj of objs) {
      const renderer = oj.getBehaviour(RendererBehaviour);
      if (!renderer || !renderer.shader) continue;

      // Manually bind the necessary buffers from each object to the active depthShader.
      // This is the correct way to render multiple objects with a single shader program.

      // 1. Bind the position buffer to the 'a_position' attribute of the depthShader.
      const positionAttributeLocation = this._gl.getAttribLocation(this.depthShader.shaderProgram, ShaderUniformsEnum.A_POSITION);
      if (positionAttributeLocation !== -1 && renderer.shader.buffers.position) {
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, renderer.shader.buffers.position);
        this._gl.vertexAttribPointer(positionAttributeLocation, 3, this._gl.FLOAT, false, 0, 0);
        this._gl.enableVertexAttribArray(positionAttributeLocation);
      }

      // 2. Bind the index buffer for the current object.
      this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, renderer.shader.buffers.indices);

      // 3. Set the transformation matrix for the current object.
      this.setMatrices(oj.transform);

      // Draw the object using its index buffer.
      this._gl.drawElements(
        WebGL2RenderingContext.TRIANGLES,
        renderer.mesh.meshData.indices.length,
        this._gl.UNSIGNED_SHORT,
        0
      );
    }

    // End the render pass, unbinding the framebuffer
    this.endPass();
  }

  setMatrices(transform: Transform) {
    if (this.depthShader) {
      // Step 1: Calculate the light's view matrix
      const { lightMvpMatrix } = this.createLightMatrices(Camera.mainCamera.transform, this.transform);
      mat4.multiply(lightMvpMatrix, lightMvpMatrix, transform.modelMatrix); // Now it's LightProjection * LightView * Model

      // Set the final combined matrix on the DEPTH shader.
      this.depthShader.setMat4("u_mvpMatrix", lightMvpMatrix);
    }
  }

  override startPass(texture: WebGLTexture, width: number, height: number): void {
    const gl = this._gl;
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
}
