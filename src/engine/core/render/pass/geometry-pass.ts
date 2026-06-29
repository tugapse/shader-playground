import { RendererBehaviour } from '@engine/behaviours';
import { CanvasViewport } from '@engine/core/canvas-viewport';
import { Camera, Scene } from '@engine/entities';
import { RenderLayer } from '@engine/enums/render-layer.enum';
import { JsonSerializedData } from '@engine/interfaces';
import { vec3 } from 'gl-matrix';
import { JsonSerializable } from '../../json-serializable';
import { IRenderPass } from './render-pass.interface';
import { CameraUBO } from '../../camera-ubo';

export class GeometryPass extends JsonSerializable implements IRenderPass {
  private gl: WebGL2RenderingContext;
  private ubo!: CameraUBO;

  // Optionally bind to an off-screen FBO texture, or leave null to render directly to the backbuffer (screen)
  // public targetFramebuffer: WebGLFramebuffer | null = null;

  constructor(gl: WebGL2RenderingContext) {
    super('GeometryPass');
    this.gl = gl;
    this.ubo = new CameraUBO(gl);
  }

  public initialize(): void {}

  public execute(scene: Scene): void {
    const camera = Camera.mainCamera;
    this.ubo.update(camera.viewMatrix, camera.projectionMatrix);
    

    // // Bind target buffer (null = default screen canvas)
    // this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    // this.gl.viewport(
    //   0,
    //   0,
    //   CanvasViewport.rendererWidth,
    //   CanvasViewport.rendererHeight,
    // );

    // Fetch and sort scene objects by distance for correct layering
    const activeObjects = scene.objects.filter((o) => o.active && o.show);

    // Sort transparent objects back-to-front
    const sortedObjects = [...activeObjects].sort((a, b) => {
      const aD = vec3.distance(
        a.transform.worldPosition,
        Camera.mainCamera.transform.worldPosition,
      );
      const bD = vec3.distance(
        b.transform.worldPosition,
        Camera.mainCamera.transform.worldPosition,
      );
      return bD - aD;
    });

    const opaque = sortedObjects.filter(
      (e) =>
        e.getBehaviour(RendererBehaviour)?.renderLayer === RenderLayer.OPAQUE,
    );
    const skybox = sortedObjects.filter(
      (e) =>
        e.getBehaviour(RendererBehaviour)?.renderLayer === RenderLayer.SKYBOX,
    );
    const transparent = sortedObjects.filter(
      (e) =>
        e.getBehaviour(RendererBehaviour)?.renderLayer ===
        RenderLayer.TRANSPARENT,
    );

    // Draw opaque objects
    for (const obj of opaque) {
      obj.draw();
    }

    // Draw skybox
    for (const obj of skybox) {
      obj.draw();
    }

    // Draw transparent objects
    for (const obj of transparent) {
      obj.draw();
    }

    // // Unbind framebuffer if it was an off-screen pass
    // if (this.targetFramebuffer) {
    //   this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    // }
  }

  public cleanup(): void {}

  public resize(width: number, height: number): void {}

  setGl(gl: WebGL2RenderingContext): void {
    this.gl = gl;
  }

  public override toJsonObject(): JsonSerializedData {
    return this.serializeAutomatically();
  }

  public override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.deserializeAutomatically(jsonObject);
  }
}
