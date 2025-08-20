
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { createTorusPrimitive, Mesh, MeshData } from '../engine/core/mesh';
import { QuadPrimitive } from '../engine/primitives/quad-primitive';
import { Canvas } from "./editor/components/canvas/canvas";

import { CommonModule } from '@angular/common';
import { CameraFlyBehaviour } from '@engine/behaviours/camera-fly-behaviour';
import { EntityBehaviour } from '@engine/behaviours/entity-behaviour';
import { RenderMeshBehaviour } from '@engine/behaviours/renderer/render-mesh-behaviour';
import { SkyboxRenderer } from '@engine/behaviours/renderer/skybox-renderer';
import { CanvasViewport } from '@engine/core/canvas-viewport';
import { EngineCache } from '@engine/core/storage';
import { GlEntity } from '@engine/entities/entity';
import { DirectionalLight, Light, PointLight } from '@engine/entities/light';
import { Scene } from '@engine/entities/scene';
import { CubemapMaterial } from '@engine/materials/cubemap-material';
import { LitMaterial } from '@engine/materials/lit-material';
import { CubePrimitive } from '@engine/primitives/cube-primitive';
import { SpherePrimitive } from '@engine/primitives/sphere-primitive';
import { LitShader } from '@engine/shaders/lit-shader';
import { Shader } from '@engine/shaders/shader';
import { SkyboxShader } from '@engine/shaders/skybox-shader';
import { vec3, vec4 } from 'gl-matrix';
import { Icon } from './editor/components/icon/icon';
import { Sidebar } from "./editor/components/sidebar/sidebar";
import { SceneManager } from '@engine/entities/scene-manager';
import { ColorMaterial } from '@engine/materials/color-material';

// class LookAtBehaviour extends EntityBehaviour {
//   public target!: GlEntity;

//   public override update(ellapsed: number): void {
//     if (this.target) {
//       this.transform.lookAt(this.target.transform.position);
//     }
//   }
// }

// class RotateBehaviour extends EntityBehaviour {
//   speed = 0.05;
//   public override update(ellapsed: number): void {
//     this.transform.rotate(1 * this.speed, 1 * this.speed, 1 * this.speed);
//   }
// }

// class moveBehaviour extends EntityBehaviour {
//   distance = 200;
//   speed = 0.02;
//   t = 1;

//   public override update(ellapsed: number): void {
//     const x = Math.sin(this.t) * this.speed;
//     const z = Math.cos(this.t) * this.speed;

//     this.transform.setPosition(this.distance * x, x + z / 2 * this.distance, this.distance * z);
//     this.parent.transform.updateModelMatrix();
//     this.t += this.speed;
//   }
// }
@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  imports: [Canvas, Icon, Sidebar, CommonModule]
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('glCanvas') glCanvas!: ElementRef<HTMLCanvasElement>;

  private gl!: WebGL2RenderingContext;
  public scene!: Scene;
  private started = false;

  ngAfterViewInit(): void {


  }

  private setupCamera(scene: Scene) {
    if (!this.scene) return;
    this.scene.camera.updateInEditor = true;
    this.scene.camera.aspectRatio = CanvasViewport.rendererWidth / CanvasViewport.rendererHeight;
    this.scene.camera.transform.lookAt(vec3.create());
    this.scene.camera.updateProjectionMatrix();
    this.scene.camera.addBehaviour(new CameraFlyBehaviour());
  }

  ngOnDestroy(): void {
    this.scene?.destroy();
  }

  initScene(scene: Scene) {
    this.createSkybox(scene);
    this.createLights(scene);
    this.addOtherObjetcs(scene);
  }

  onGlContextCreated(gl: WebGL2RenderingContext) {
    this.gl = gl
    this.scene = new Scene();
    this.scene.isEditorMode = true;
    this.scene.name = "Main Scene";
    this.scene.initialize();
    this.setupCamera(this.scene);
    this.loadAssets(this.scene).then(() => {
      setTimeout(() => {
        const sceneJsonData = this.scene.toJsonObject();
        const thescene = SceneManager.loadScene(this.gl, sceneJsonData);
        this.scene = thescene;
        // this.createSkybox(thescene);
        // this.addOtherObjetcs(thescene);
        thescene.initialize();
        this.setupCamera(this.scene);

      }, 3000);

      // this.scene = oldScene;
    });
  }

  async loadAssets(scene: Scene) {
    this.started = true;

    this.createSkybox(scene);
    this.createLights(scene);
    this.addOtherObjetcs(scene);
    await this.addMonkeyObj(scene);

  }

  async addOtherObjetcs(scene: Scene) {

    const torusPrimitive = await createTorusPrimitive();
    const torus = this.createPrimitive("torus", torusPrimitive, new RenderMeshBehaviour(this.gl));
    torus.transform.scale(2, 2, 2);
    // torus.addBehaviour(new RotateBehaviour());
    scene.addEntity(torus);

    const cube = this.createPrimitive("cube", new CubePrimitive(), new RenderMeshBehaviour(this.gl));
    const cubePos = vec3.create();
    vec3.scaleAndAdd(cubePos, cubePos, cube.transform.left, 2.5);
    vec3.scaleAndAdd(cubePos, cubePos, cube.transform.up, 2.5);
    cube.transform.setPosition(cubePos[0], cubePos[1], cubePos[2]);
    scene.addEntity(cube);

    const sphere = this.createPrimitive("sphere", new SpherePrimitive(), new RenderMeshBehaviour(this.gl));
    const spherePos = vec3.create();
    vec3.scaleAndAdd(spherePos, spherePos, sphere.transform.right, 2.5);
    vec3.scaleAndAdd(spherePos, spherePos, sphere.transform.up, 2.5);
    sphere.transform.setPosition(spherePos[0], spherePos[1], spherePos[2]);
    scene.addEntity(sphere);
  }

  private createLights(scene: Scene) {

    const ambient = new Light("Ambient Light");

    const dlight = new DirectionalLight("Directional light");
    let dir = vec3.create();
    dlight.direction = vec3.normalize(dir, vec3.fromValues(15, 180, 30));
    dlight.color = vec4.fromValues(0.15, 0.15, 0.15, 1);

    const plight = new PointLight("Point light");
    // plight.addBehaviour(new moveBehaviour());
    // plight.transform.translate(0, 0, 1);
    plight.attenuation = { constant: 1, linear: 0.1, quadratic: 0.005 };
    plight.color = vec4.fromValues(0, 0, 1, 0.9);

    const plight1 = new PointLight("Point light 1");
    plight1.transform.translate(0, 1, 1);
    plight1.attenuation = { constant: 1, linear: 0.1, quadratic: 0.005 };
    plight1.color = vec4.fromValues(1, 0, 0, 0.7);

    scene.addEntity(ambient);
    scene.addEntity(dlight);
    // scene.addEntity(plight);
    // scene.addEntity(plight1);
  }

  private async addMonkeyObj(scene: Scene) {

    const monkeyObj = await EngineCache.getMeshDataFromObj("assets/objs/monkey.obj");
    const monkeyPrimitive = this.createPrimitive("Monkey", monkeyObj, new RenderMeshBehaviour(this.gl));
    scene.addEntity(monkeyPrimitive);

    const movingMokeyPrimitive = this.createPrimitive("Monkey", monkeyObj, new RenderMeshBehaviour(this.gl));
    movingMokeyPrimitive.transform.translate(-3.5, 0, 0);
    // movingMokeyPrimitive.addBehaviour(new moveBehaviour())
    scene.addEntity(movingMokeyPrimitive);


    const renderer = movingMokeyPrimitive.getBehaviour(RenderMeshBehaviour);
    if (renderer) {
      const material = renderer.shader.material as LitMaterial;
      material.normalTexUrl = "";
    }


    // const lookAtBehaviour = new LookAtBehaviour();
    // lookAtBehaviour.target = movingMokeyPrimitive;
    // monkeyPrimitive.addBehaviour(lookAtBehaviour);

  }

  private createPrimitive(
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

    meshRenderer.mesh = mesh;
    if (material) {
      meshRenderer.shader = shader || new LitShader(this.gl, material as LitMaterial);
    }
    entity.addBehaviour(meshRenderer);

    return entity;
  }


  async createSkybox(scene: Scene) {


    const cubePrimitive = new CubePrimitive();
    const material = new CubemapMaterial();
    const shader = new SkyboxShader(this.gl, material);
    const cube = this.createPrimitive("Skybox", cubePrimitive, new SkyboxRenderer(this.gl), shader);

    scene.addEntity(cube);
  }
}
