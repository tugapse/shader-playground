import { Scene } from '@engine/entities';
import { IRenderPass } from './render-pass.interface';
import { ClassType } from '@engine/enums/class-type.enum';
import { JsonSerializedData } from '@engine/interfaces';
import { JsonSerializable } from '../json-serializable';
import { ObjectInstanciator } from '../object-instanciator';
import { ShadowMapPass } from './shadowmapPass';
import { GeometryPass } from './geometry-pass';
import { ScreenBlitPass } from './screen-blit';

export class RenderPipeline extends JsonSerializable {
  static instanciate() {
    return new RenderPipeline();
  }

  public get shadowMap() {
    return this._shadowmapPass;
  }

  protected _gl!: WebGL2RenderingContext;
  protected scene!: Scene;
  protected _shadowmapPass!: ShadowMapPass;
  protected _geometryPass!: GeometryPass;
  protected _screenBlit!: ScreenBlitPass;

  private _passes: IRenderPass[] = [];

  constructor(public override name: string = 'Render Pipeline') {
    super('RenderPipeline');
  }

  public setGlRenderingContext(gl: WebGL2RenderingContext): void {
    this._gl = gl;

    if (!this._shadowmapPass) {
      this._shadowmapPass = new ShadowMapPass(this._gl);
      this.addPass(this._shadowmapPass);
    }
    if (!this._geometryPass) {
      this._geometryPass = new GeometryPass(this._gl);
      this.addPass(this._geometryPass);
    }
    if (!this._screenBlit) {
      this._screenBlit = new ScreenBlitPass(this._gl);
      this.addPass(this._screenBlit);
    }
    
    // Ensure setGl exists on IRenderPass if you rely on it, otherwise remove/type-guard it safely
    this._passes.forEach((pass) => {
      if (typeof (pass as any).setGl === 'function') {
        (pass as any).setGl(gl);
      }
    });
  }

  public initialize(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Inject a new render pass into the pipeline.
   */
  public addPass(pass: IRenderPass): void {
    if (this._gl) {
      pass.initialize(this._gl);
    }
    this._passes.push(pass);
  }

  public draw() {
    if (!this.scene) {
      console.error('No scene defined for this render pipeline');
      return;
    }

    // Individual passes handle their own clearing/binding targets.
    // Do not clear the backbuffer globally here unless you have a dedicated final blit pass.

    for (const pass of this._passes) {
      pass.execute(this.scene);
    }
  }

  public resize(width: number, height: number): void {
    for (const pass of this._passes) {
      pass.resize(width, height);
    }
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
  description: 'Modular Render Pipeline supporting injected passes.',
});