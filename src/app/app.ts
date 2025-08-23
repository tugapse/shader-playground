
import { Component, OnDestroy } from '@angular/core';

import { CameraFlyBehaviour } from '@engine/behaviours/camera-fly-behaviour';
import { RenderMeshBehaviour } from '@engine/behaviours/renderer/render-mesh-behaviour';
import { SkyboxRenderer } from '@engine/behaviours/renderer/skybox-renderer';
import { CanvasViewport } from '@engine/core/canvas-viewport';
import { EngineCache } from '@engine/core/engineCache';
import { Camera } from '@engine/entities/camera';
import { GlEntity } from '@engine/entities/entity';
import { DirectionalLight, Light, PointLight } from '@engine/entities/light';
import { Scene } from '@engine/entities/scene';
import { CubemapMaterial } from '@engine/materials/cubemap-material';
import { LitMaterial } from '@engine/materials/lit-material';
import { CubePrimitive } from '@engine/primitives/cube-primitive';
import { QuadPrimitive } from '@engine/primitives/quad-primitive';
import { SpherePrimitive } from '@engine/primitives/sphere-primitive';
import { LitShader } from '@engine/shaders/lit-shader';
import { Shader } from '@engine/shaders/shader';
import { SkyboxShader } from '@engine/shaders/skybox-shader';
import { vec2, vec3, vec4 } from 'gl-matrix';

import { Editor } from '@editor/editor';
import { EditorService } from '@editor/editor.service';
import { LightMoveBehaviour } from './example/behaviours/light-move';
import { LookAtBehaviour } from './example/behaviours/look-at';
import { MoveBehaviour } from './example/behaviours/move';
import { RotateBehaviour } from './example/behaviours/rotate';
import { loadTorusPrimitive, MeshData, Mesh } from '@engine/core/mesh';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  imports: [Editor]
})
export class App implements OnDestroy {

  private gl!: WebGL2RenderingContext;
  private scene!: Scene;
  dLight!: DirectionalLight;
  torus!: GlEntity;

  constructor(private editorService: EditorService) {
    this.editorService.onRenderingContextCreated.subscribe(this.onGlContextCreated.bind(this));
    this.editorService.onSceneLoaded.subscribe(this.initialiScene.bind(this));
  }

  ngOnDestroy(): void {
    this.scene?.destroy();
  }


  private async otherObjetcs(scene: Scene) {

    const torusPrimitive = await loadTorusPrimitive();
    const torus = this.createEntity("torus", torusPrimitive, new RenderMeshBehaviour(this.gl));
    torus.transform.scale(2, 2, 2);
    torus.transform.translate(0, 2, 0);

    torus.addBehaviour(new RotateBehaviour());
    torus.addBehaviour(new LightMoveBehaviour());
    scene.addEntity(torus);
    this.torus = torus;

    const cube = this.createEntity("cube", new CubePrimitive(), new RenderMeshBehaviour(this.gl));
    const cubePos = vec3.create();
    vec3.scaleAndAdd(cubePos, cubePos, cube.transform.left, 2.5);
    vec3.scaleAndAdd(cubePos, cubePos, cube.transform.up, 2.5);
    cube.transform.setPosition(cubePos[0], cubePos[1], cubePos[2]);
    scene.addEntity(cube);

    const sphere = this.createEntity("sphere", new SpherePrimitive(), new RenderMeshBehaviour(this.gl));
    const spherePos = vec3.create();
    vec3.scaleAndAdd(spherePos, spherePos, sphere.transform.right, 2.5);
    vec3.scaleAndAdd(spherePos, spherePos, sphere.transform.up, 2.5);
    sphere.transform.setPosition(spherePos[0], spherePos[1], spherePos[2]);
    scene.addEntity(sphere);
  }

  private createQuad(scene: Scene) {
    const plane = this.createEntity("plane", new QuadPrimitive(), new RenderMeshBehaviour(this.gl));
    const renderer = plane.getBehaviour(RenderMeshBehaviour) as RenderMeshBehaviour;
    if (renderer) {
      const material = renderer.shader.material as LitMaterial;
      material.uvScale = vec2.fromValues(500, 500)


    }
    plane.transform.translate(0, -2, 0);
    plane.transform.rotate(270 * Math.PI / 180, 0, 0);
    plane.transform.scale(500, 500, 500);
    scene.addEntity(plane);
  }

  private createLights(scene: Scene) {

    const ambient = new Light("Ambient Light");

    const dlight = new DirectionalLight("Directional light");
    dlight.transform.translate(0, 20, 0);
    dlight.direction = vec3.create();
    dlight.color = vec4.fromValues(0.7, 0.7, 0.7, 1);
    dlight.addBehaviour(new LightMoveBehaviour())
    this.dLight = dlight;

    const plight = new PointLight("Point light");
    plight.transform.translate(0, 0, 0);
    plight.attenuation = { constant: 1, linear: 0.2, quadratic: 0.002 };
    plight.color = vec4.fromValues(1, 0.8, 0.6, 1);

    const plight1 = new PointLight("Point light 1");
    // plight1.transform.translate(0, 1, 1);
    plight1.attenuation = { constant: 1, linear: 0.7, quadratic: 0.009 };
    plight1.color = vec4.fromValues(1, 1, 1, 1);
    plight1.addBehaviour(new MoveBehaviour());


    // scene.addEntity(ambient);
    scene.addEntity(dlight);
    scene.addEntity(plight);
    scene.addEntity(plight1);
  }

  private async addMonkeyObj(scene: Scene) {

    const monkeyObj = await EngineCache.getMeshDataFromObj("assets/objs/monkey.obj");
    const monkeyPrimitive = this.createEntity("Monkey", monkeyObj, new RenderMeshBehaviour(this.gl));
    scene.addEntity(monkeyPrimitive);

    const movingMokeyPrimitive = this.createEntity("MovingMonkey", monkeyObj, new RenderMeshBehaviour(this.gl));
    movingMokeyPrimitive.transform.translate(-3.5, 0, 0);
    movingMokeyPrimitive.addBehaviour(new LightMoveBehaviour())
    scene.addEntity(movingMokeyPrimitive);




    const lookAtBehaviour = new LookAtBehaviour();
    lookAtBehaviour.targetId = movingMokeyPrimitive.uuid;
    lookAtBehaviour.follow = true;
    monkeyPrimitive.addBehaviour(lookAtBehaviour);

  }

  private createEntity(
    name: string, meshData: MeshData,
    meshRenderer: RenderMeshBehaviour,
    shader?: Shader,
    material?: LitMaterial
  ): GlEntity {

    const entity = new GlEntity(name);
    const mesh = new Mesh()

    mesh.meshData = meshData
    if (!shader && !material)
      material = new LitMaterial();
    else if (shader?.material)
      material = shader.material as LitMaterial;
    material!.mainTexUrl = "assets/images/wood-texture.jpg";
    material!.normalTexUrl = "assets/images/wood-texture-normal-map.jpg";
    material!.normalMapStrength = 0.1;
    material!.specularStrength = 0.4
    material!.roughness = 0;
    meshRenderer.mesh = mesh;
    if (material) {
      meshRenderer.shader = shader || new LitShader(this.gl, material as LitMaterial);
    }
    entity.addBehaviour(meshRenderer);

    return entity;
  }

  private async createSkybox(scene: Scene) {

    const cubePrimitive = new CubePrimitive();
    const material = new CubemapMaterial();
    const shader = new SkyboxShader(this.gl, material);
    const cube = this.createEntity("Skybox", cubePrimitive, new SkyboxRenderer(this.gl), shader);

    scene.addEntity(cube);
  }

  private async onGlContextCreated(gl: WebGL2RenderingContext) {
    this.gl = gl
    const scene = new Scene();
    scene.name = "Main Scene";
    await this.loadAssets(scene);
    this.editorService.loadScene(scene);
  }

  private async loadAssets(scene: Scene) {
    this.createQuad(scene);
    this.otherObjetcs(scene);
    this.createSkybox(scene);
    this.createLights(scene);
    await this.addMonkeyObj(scene);

  }

  private initialiScene(scene: Scene): any {
    this.scene = scene
    this.scene.initialize();
    this.setupCamera(this.scene);
  }

  private setupCamera(scene: Scene) {
    if (!Camera.mainCamera) return;
    Camera.mainCamera.updateInEditor = true;
    Camera.mainCamera.aspectRatio = CanvasViewport.rendererWidth / CanvasViewport.rendererHeight;
    Camera.mainCamera.transform.lookAt(vec3.create());
    Camera.mainCamera.updateProjectionMatrix();
    Camera.mainCamera.addBehaviour(new CameraFlyBehaviour());
  }
}
