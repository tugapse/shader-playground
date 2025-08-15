import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { RenderMeshBehaviour } from '../engine/behaviours/render-mesh-behaviour';
import { createTorusPrimitive, Mesh, MeshData } from '../engine/core/mesh';
import { Transform } from '../engine/core/transform';
import { QuadPrimitive } from '../engine/primitives/quad';
import { Canvas } from "./components/canvas/canvas";

import { EntityBehaviour } from '@engine/behaviours/entity-behaviour';
import { CanvasViewport } from '@engine/core/canvas-viewport';
import { EngineCache } from '@engine/core/storage';
import { Camera } from '@engine/entities/camera';
import { GlEntity } from '@engine/entities/entity';
import { DirectionalLight, Light, PointLight } from '@engine/entities/light';
import { Scene } from '@engine/entities/scene';
import { LitMaterial } from '@engine/materials/lit-material';
import { SpherePrimitive } from '@engine/primitives/sphere';
import { LitShader } from '@engine/shaders/lit-shader';
import { vec3, vec4 } from 'gl-matrix';
import { CubePrimitive } from '@engine/primitives/cube';


class moveBehaviour extends EntityBehaviour {
  offset = 0;
  speed = 0.005;
  distance = 1;
  override initialize(): void {
    // this.parent.transform.translate(0, 0, 0);
  }
  public override update(ellapsed: number): void {
    const x = Math.sin(this.distance) * this.speed;
    // console.log(x, "parent", this.parent.name, this.parent.transform.position)
    // this.parent.transform.translate(0, x, 0);

    this.parent.transform.rotate(0,1,1)
    this.parent.transform.updateModelMatrix();
    this.distance += this.speed;
  }
}
@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  imports: [Canvas]
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('glCanvas') glCanvas!: ElementRef<HTMLCanvasElement>;

  private gl!: WebGLRenderingContext;
  public scene!: Scene;
  private started = false;

  ngAfterViewInit(): void {
    this.scene = new Scene();
    this.scene.name = "Main Scene";
    this.loadAssets().then(() => {

      Camera.mainCamera.aspectRatio = CanvasViewport.rendererWidth / CanvasViewport.rendererHeight;
      Camera.mainCamera.updateProjectionMatrix();
      this.scene.initialize()
    }
    );
  }

  ngOnDestroy(): void {
    this.scene.destroy();
  }

  onGlContextCreated(gl: WebGLRenderingContext) {
    this.gl = gl
  }

  async loadAssets() {
    if (this.started) return;
    this.started = true;

    this.createLights();

    const cubePRimitive = new CubePrimitive();
    const cube = this.createPrimitive("cube", cubePRimitive);
    const cubePos = vec3.create();
    vec3.scaleAndAdd(cubePos, cubePos, cube.transform.right, -2.5);
    cube.transform.setPosition(cubePos[0], cubePos[1], cubePos[2]);

    this.scene.addEntity(cube);


    const torusPrimitive = await createTorusPrimitive();
    const torus = this.createPrimitive("torus", torusPrimitive);
    const torusPos = vec3.create();
    vec3.scaleAndAdd(torusPos,torusPos,torus.transform.right,2.8);
    // torus.addBehaviour(new moveBehaviour());
    torus.transform.setPosition(torusPos[0], torusPos[1], torusPos[2]);
    // const renderer = torus.getBehaviour(RenderMeshBehaviour);
    // if(renderer){
    //   renderer.shader.fragUri = "assets/shaders/frag/debug.glsl";
    //   renderer.shader.recompile();
    // }
    this.scene.addEntity(torus);

    const quad = this.createPrimitive("quad", new QuadPrimitive());
    const quadPos = vec3.create();
    vec3.scaleAndAdd(quadPos, quadPos, quad.transform.left, 2.5);
    vec3.scaleAndAdd(quadPos, quadPos, quad.transform.up, 2.5);
    quad.transform.setPosition(quadPos[0], quadPos[1], quadPos[2]);
    this.scene.addEntity(quad);

    const sphere = this.createPrimitive("sphere", new SpherePrimitive());
    const spherePos = vec3.create();
    vec3.scaleAndAdd(spherePos, spherePos, sphere.transform.right, 2.5);
    vec3.scaleAndAdd(spherePos, spherePos, sphere.transform.up, 2.5);
    sphere.transform.setPosition(spherePos[0], spherePos[1], spherePos[2]);
    this.scene.addEntity(sphere);

    await this.addMonkeyObj();

  }

  private createLights() {
    const ambient = new Light("Ambient Light");

    const dlight = new DirectionalLight("Directional light");
    dlight.addBehaviour(new moveBehaviour());
    let dir = vec3.create();
    dlight.direction = vec3.normalize(dir, vec3.fromValues(-0, 180, 30));
    dlight.color = vec4.fromValues(0.7, 0.7, 0.7, 1);

    const plight = new PointLight("Point light");
    plight.addBehaviour(new moveBehaviour());
    plight.transform.translate(0, -1, 0);
    plight.attenuation = { constant: 2, linear: 0.01, quadratic: 0.005 };
    plight.color = vec4.fromValues(0, 0, 2, 1);

    const plight1 = new PointLight("Point light 1");
    plight1.transform.translate(0, 1, 1);
    plight1.attenuation = { constant: 1, linear: 0.01, quadratic: 0.005 };
    plight1.color = vec4.fromValues(1, 0, 0, 1);

    this.scene.addEntity(ambient);
    this.scene.addEntity(dlight);
    this.scene.addEntity(plight);
    this.scene.addEntity(plight1);
  }

  private async addMonkeyObj() {
    const monkeyObj = await EngineCache.getMeshDataFromObj("assets/objs/monkey.obj");
    const monkeyPRimitive = this.createPrimitive("Monkey", monkeyObj);

    this.scene.addEntity(monkeyPRimitive);
  }

  private createPrimitive(
    name: string, meshData: MeshData,
    material = new LitMaterial(),
    shader = new LitShader(this.gl, material)): GlEntity {

    const entity = new GlEntity(name);
    const meshRenderer: RenderMeshBehaviour = new RenderMeshBehaviour(this.gl);
    const mesh = new Mesh()

    mesh.meshData = meshData

    meshRenderer.mesh = mesh;
    meshRenderer.material = material;
    meshRenderer.shader = shader;

    entity.addBehaviour(meshRenderer);

    return entity;
  }
}
