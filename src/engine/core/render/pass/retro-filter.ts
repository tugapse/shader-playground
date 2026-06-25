import { Scene } from '@engine/entities';
import { JsonSerializable } from '@engine/interfaces';
import { Shader, ShaderSources } from '@engine/shaders';
import { Texture } from '@engine/textures';
import { IRenderPass } from './render-pass.interface';

export class PostProcessingPass
  extends JsonSerializable
  implements IRenderPass
{
  private gl!: WebGL2RenderingContext;
  private postShader!: Shader;
  private emptyVAO!: WebGLVertexArrayObject;

  public enabled = true;
  private timeAccumulator = 0.0;

  private inputTexture: Texture | null = null;

  constructor(gl: WebGL2RenderingContext) {
    super('PostProcessingPass');
    this.setGl(gl);
  }

  cleanup(): void {
    this.postShader.release();
    if (this.emptyVAO) {
      this.gl.deleteVertexArray(this.emptyVAO);
    }
  }

  public setGl(gl: WebGL2RenderingContext): void {
    this.gl = gl;
    this.postShader = new Shader(
      gl,
      null as any,
      ShaderSources.frag.retro,
      ShaderSources.vertex.screen_quad, 
    );
    this.postShader.initialize();

    // Create an empty VAO to satisfy WebGL2 strict draw requirements
    this.emptyVAO = this.gl.createVertexArray()!;
  }

  public initialize(gl: WebGL2RenderingContext): void {
    this.setGl(gl);
  }

  public setInputTexture(texture: Texture | null): void {
    this.inputTexture = texture;
  }

  public execute(scene: Scene): void {
    if (!this.enabled || !this.inputTexture || !this.postShader._shaderProgram)
      return;

    this.timeAccumulator += 0.016;

    this.gl.disable(this.gl.DEPTH_TEST);
    this.postShader.use();

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.inputTexture.glTexture);
    this.postShader.setInt('u_screenTexture', 0);

    this.postShader.setFloat('u_time', this.timeAccumulator);
    this.postShader.setFloat('u_distortionStrength', 0.15);
    this.postShader.setFloat('u_aberrationSpread', 0.008);

    // --- DRAW FULLSCREEN QUAD ---
    // Bind the empty VAO before drawing arrays
    this.gl.bindVertexArray(this.emptyVAO);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    this.gl.bindVertexArray(null);

    this.postShader.release();
    this.gl.enable(this.gl.DEPTH_TEST);
  }

  public resize(width: number, height: number): void {}
}