import { Camera, Scene } from '@engine/entities';
import { ClassType } from '@engine/enums/class-type.enum';
import { JsonSerializedData } from '@engine/interfaces';
import { Texture } from '@engine/textures';
import { JsonSerializable } from '../json-serializable';
import { ObjectInstanciator } from '../object-instanciator';
import { GeometryPass } from './pass/geometry-pass';
import { IRenderPass } from './pass/render-pass.interface';
import { ScreenBlitPass } from './pass/screen-blit';
import { ShadowMapPass } from './pass/shadowmapPass';
import { CanvasViewport } from '../canvas-viewport';
import { PostProcessingPass } from './pass/retro-filter';
import { CameraUBO } from '../camera-ubo';

export class RenderPipeline extends JsonSerializable {
  static instanciate() {
    return new RenderPipeline();
  }

  public get shadowMap() {
    return this._shadowmapPass;
  }

  protected _gl!: WebGL2RenderingContext;
  protected ubo! : CameraUBO;
  protected scene!: Scene;
  protected _shadowmapPass!: ShadowMapPass;
  protected _geometryPass!: GeometryPass;
  protected _screenBlit!: PostProcessingPass;

  private _passes: IRenderPass[] = [];

  // Single Buffer properties
  protected _framebuffer: WebGLFramebuffer | null = null;
  protected _colorTexture: Texture | null = null;
  protected _depthRenderbuffer: WebGLRenderbuffer | null = null;

  protected _bufferWidth = 0;
  protected _bufferHeight = 0;

  constructor(public override name: string = 'Render Pipeline') {
    super('RenderPipeline');
  }

  public get sceneTexture(): Texture | null {
    return this._colorTexture;
  }

  public get framebuffer(): WebGLFramebuffer | null {
    return this._framebuffer;
  }

  public setGlRenderingContext(gl: WebGL2RenderingContext): void {
    this._gl = gl;
    this.ubo = new CameraUBO(this._gl);

    if (!this._shadowmapPass) {
      this._shadowmapPass = new ShadowMapPass(this._gl);
      this.addPass(this._shadowmapPass);
    }
    if (!this._geometryPass) {
      this._geometryPass = new GeometryPass(this._gl);
      this.addPass(this._geometryPass);
    }
    // if (!this._retropass) {
    //   this._retropass = new PostProcessingPass(this._gl);
    //   this._retropass.setInputTexture(this.sceneTexture)
    //   this.addPass(this._retropass);
    // }

    // if (!this._screenBlit) {
    //   this._screenBlit = new PostProcessingPass(this._gl);
    //   this.addPass(this._screenBlit);
    // }

    this._passes.forEach((pass) => {
      if (typeof (pass as any).setGl === 'function') {
        (pass as any).setGl(gl);
      }
    });

    const width = CanvasViewport.rendererWidth || 1024;
    const height = CanvasViewport.rendererHeight || 768;
    this.recreateSingleBuffer(width, height);
  }

  public initialize(scene: Scene) {
    this.scene = scene;
  }

  public addPass(pass: IRenderPass): void {
    if (this._gl) {
      pass.initialize(this._gl);
    }
    this._passes.push(pass);
  }

  protected recreateSingleBuffer(width: number, height: number): void {
    if (!this._gl) return;

    this._bufferWidth = width;
    this._bufferHeight = height;

    this.cleanupSingleBuffer();

    // Allocate single off-screen framebuffer target
    this._framebuffer = this._gl.createFramebuffer();
    this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._framebuffer);

    this._colorTexture = Texture.create(this._gl, width, height);
    this._gl.framebufferTexture2D(
      this._gl.FRAMEBUFFER,
      this._gl.COLOR_ATTACHMENT0,
      this._gl.TEXTURE_2D,
      this._colorTexture!.glTexture,
      0,
    );

    this._depthRenderbuffer = this._gl.createRenderbuffer();
    this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, this._depthRenderbuffer);
    this._gl.renderbufferStorage(
      this._gl.RENDERBUFFER,
      this._gl.DEPTH_COMPONENT16,
      width,
      height,
    );
    this._gl.framebufferRenderbuffer(
      this._gl.FRAMEBUFFER,
      this._gl.DEPTH_ATTACHMENT,
      this._gl.RENDERBUFFER,
      this._depthRenderbuffer,
    );

    this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
  }

  public draw() {
    if (!this.scene) {
      console.error('No scene defined for this render pipeline');
      return;
    }
    const camera =Camera.mainCamera;

    
    for (let i = 0; i < this._passes.length; i++) {
      const pass = this._passes[i];
      
      // Specialty passes (e.g., ShadowMap) manage their own binding scopes
      if (pass.name === 'ShadowMapPass') {
        pass.execute(this.scene);
        continue;
      }
      
      this.ubo.update(camera.viewMatrix,camera.projectionMatrix);
      this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
      this._gl.viewport(0, 0, this._gl.canvas.width, this._gl.canvas.height);

      // Final screen output pass reads off-screen color texture and draws to canvas (null)
      if (pass.name === 'ScreenBlitPass') {
        // this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
        // this._gl.viewport(0, 0, this._gl.canvas.width, this._gl.canvas.height);

        if ('setInputTexture' in pass) {
          (pass as any).setInputTexture(this._colorTexture);
        }

        pass.execute(this.scene);
        continue;
      }

      // Route all intermediate render passes (e.g., GeometryPass) to the single off-screen buffer
      // this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._framebuffer);
      // this._gl.viewport(0, 0, this._bufferWidth, this._bufferHeight);

      pass.execute(this.scene);
    }

    // Unbind buffer cleanly at the end of frame execution
    this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);

  }

  public resize(width: number, height: number): void {
    this.recreateSingleBuffer(width, height);
    for (const pass of this._passes) {
      pass.resize(width, height);
    }
  }

  protected cleanupSingleBuffer(): void {
    if (!this._gl) return;
    if (this._framebuffer) this._gl.deleteFramebuffer(this._framebuffer);
    if (this._colorTexture) this._colorTexture!.destroy();
    if (this._depthRenderbuffer)
      this._gl.deleteRenderbuffer(this._depthRenderbuffer);
  }

  public override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.deserializeAutomatically(jsonObject);
  }

  public override toJsonObject(): JsonSerializedData {
    return this.serializeAutomatically();
  }
}

ObjectInstanciator.addDependency('RenderPipeline', RenderPipeline.instanciate, {
  name: 'RenderPipeline',
  type: ClassType.RenderBehaviour,
  path: 'Renderers/RenderPipeline',
  description:
    'Modular Render Pipeline supporting injected passes with internal single buffering functionality.',
});
