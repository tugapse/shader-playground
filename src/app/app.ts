
import { Component, OnDestroy } from '@angular/core';


import { SkyboxRenderer } from '@engine/behaviours/renderer/skybox-renderer';
import { CanvasViewport } from '@engine/core/canvas-viewport';
import { EngineCache } from '@engine/core/engineCache';
import { Camera } from '@engine/entities/camera';
import { GlEntity } from '@engine/entities/entity';
import { DirectionalLight, PointLight, SpotLight } from '@engine/entities/light';
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
import { RenderMeshBehaviour } from '@engine/behaviours/renderer/render-mesh-behaviour';
import { Color, Colors } from '@engine/core';
import { loadTorusPrimitive, Mesh, MeshData } from '@engine/core/mesh';
import { Vector3 } from '@engine/core/vector';
import { LightMoveBehaviour } from '../editor/behaviours/light-move';
import { RotateBehaviour } from '../editor/behaviours/rotate';
import { MoveBehaviour } from '@editor/behaviours/move';
import { PlanePrimitive } from '@engine/primitives';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  imports: [Editor]
})
export class App implements OnDestroy {

  private gl!: WebGL2RenderingContext;
  private scene!: Scene;
  light!: DirectionalLight;
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
    scene.addEntity(torus);

    const cube = this.createEntity("cube", new CubePrimitive(), new RenderMeshBehaviour(this.gl));
    const cubePos = vec3.create();
    vec3.scaleAndAdd(cubePos, cubePos, cube.transform.left, 2.5);
    vec3.scaleAndAdd(cubePos, cubePos, cube.transform.up, 2.5);
    cube.transform.setPosition(cubePos[0], cubePos[1], cubePos[2]);
    scene.addEntity(cube);

    const sphere = this.createEntity("sphere", new SpherePrimitive(), new RenderMeshBehaviour(this.gl));
    // sphere.addBehaviour(new LightMoveBehaviour());
    scene.addEntity(sphere);
    // sphere.addBehaviour();
  }

  private createFloor(scene: Scene) {
    const plane = this.createEntity("plane", new PlanePrimitive(1), new RenderMeshBehaviour(this.gl));

    const renderer = plane.getBehaviour(RenderMeshBehaviour) as RenderMeshBehaviour;
    if (renderer) {
      const material = renderer.shader.material as LitMaterial;
      material.normalMapStrength = 1;
      material.specularStrength = 0.8;
      material.roughness = 1.1;
      material.uvScale = vec2.fromValues(50, 50)



      renderer.mesh.meshData.invertNormals();
      debugger
    }
    plane.transform.translate(0, -2, 0);
    // plane.transform.rotate(270, 0, 0);
    plane.transform.scale(500, 500, 500);
    scene.addEntity(plane);
  }

  private createLights(scene: Scene) {


    const dlight = new DirectionalLight("Directional light");
    dlight.transform.rotate(0.7, 1, 0.2);

    dlight.color = Colors.cadetBlue;
    dlight.addBehaviour(new LightMoveBehaviour())

    const plight = new PointLight("Point light");
    plight.transform.translate(0, 0, 0);
    plight.attenuation = { constant: 1, linear: 0.1, quadratic: 0.002 };
    plight.color = Colors.red;

    const spotLight = new SpotLight("Point light 1");
    spotLight.attenuation = { constant: 1, linear: 0.2, quadratic: 0.008 };
    spotLight.coneAngles = {inner:15 , outer:20}
    spotLight.color = new Color();
    // spotLight.addBehaviour(new LightMoveBehaviour());
    this.light = spotLight;

    scene.addEntity(plight);
    scene.addEntity(spotLight);
    scene.addEntity(dlight);
  }

  private async addMonkeyObj(scene: Scene) {

    const monkeyObj = await EngineCache.getMeshDataFromObj("assets/objs/monkey.obj");
    const monkeyEntity = this.createEntity("Monkey", monkeyObj, new RenderMeshBehaviour(this.gl));
    monkeyEntity.transform.translate(3.5, 0, 0);
    scene.addEntity(monkeyEntity);
    monkeyEntity.transform.setParent(this.light.transform)



    const movingMokeyEntity = this.createEntity("MovingMonkey", monkeyObj, new RenderMeshBehaviour(this.gl));
    movingMokeyEntity.transform.translate(-3.5, 0, 0);

    scene.addEntity(movingMokeyEntity);

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
    material!.mainTexUrl = "assets/images/brick-wall/TCom_Wall_Stone3_2x2_512_albedo.jpeg";
    material!.normalTexUrl = "assets/images/brick-wall/TCom_Wall_Stone3_2x2_512_normal.jpeg";
    material!.normalMapStrength = 0.5;
    material!.specularStrength = 1;
    material!.roughness = 1;
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
    this.createFloor(scene);
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
  }
}
