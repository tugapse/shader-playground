import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { RenderMeshBehaviour } from '../engine/behaviours/render-mesh-behaviour';
import { Mesh, MeshData } from '../engine/core/mesh';
import { Transform } from '../engine/core/transform';
import { UnlitMaterial } from '../engine/materials/unlit-material';
import { QuadPrimitive } from '../engine/primitives/quad';
import { Shader } from '../engine/shaders/shader';
import { Canvas } from "./components/canvas/canvas";

import { Scene } from '@engine/entities/scene';
import { GlEntity } from '@engine/entities/entity';
import { CubePrimitive } from '@engine/primitives/cube';
import { SpherePrimitive } from '@engine/primitives/sphere';
import { vec3, vec4 } from 'gl-matrix';
import { ObjParser } from '@engine/parsers/obj-parser';
import { TrianglePrimitive } from '@engine/primitives/triangle';
import { CanvasViewport } from '@engine/core/canvas-viewport';
import { Camera } from '@engine/entities/camera';
import { UnlitShader } from '@engine/shaders/unlit-shader';
import { LitShader } from '@engine/shaders/lit-shader';
import { LitMaterial } from '@engine/materials/lit-material';
import { DirectionalLight, Light, PointLight } from '@engine/entities/light';
import { EntityBehaviour } from '@engine/behaviours/entity-behaviour';


class moveBehaviour extends EntityBehaviour {
  offset = 5;
  speed = 0.01;
  distance = 15;
  override initialize(): void {
    this.parent.transform.translate(0, -2, 0);
  }
  public override update(ellapsed: number): void {
    const x = this.offset * Math.cos(this.distance) * this.speed;
    // console.log(x, "parent", this.parent.name, this.parent.transform.position)
    this.parent.transform.translate(x,x*0.2,0);
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
  private objPArser!: ObjParser

  ngAfterViewInit(): void {
    this.objPArser = new ObjParser();
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

    const ambient = new Light("Ambient Light");
    ambient.color = vec4.fromValues(0.2, 0.2, 0.2, 1)
    this.scene.addEntity(ambient);

    const dlight = new DirectionalLight("Directional light");
    let dir = vec3.create();
    dlight.direction = vec3.normalize(dir, vec3.fromValues(-100, 180, 0));
    dlight.color = vec4.fromValues(1, 1, 1, 1)
    this.scene.addEntity(dlight);


    const plight = new PointLight("Point light");
    plight.transform.translate(0, 2, 2);
    plight.addBehaviour(new moveBehaviour(plight));
    plight.attenuation = { constant: 2, linear: 0.1, quadratic: 0.005 }
    plight.color = vec4.fromValues(0.2, 0, 3, 1);
    this.scene.addEntity(plight);

    const cube = this.createPrimitive("cube", new CubePrimitive());
    const cubePos = vec3.create();
    vec3.scaleAndAdd(cubePos, cubePos, cube.transform.left, 2.5);
    cube.addBehaviour(new moveBehaviour(cube));
    cube.transform.setPosition(cubePos[0], cubePos[1], cubePos[2]);
    this.scene.addEntity(cube);

    const quad = this.createPrimitive("quad", new QuadPrimitive());
    this.scene.addEntity(quad);

    const quadPos = vec3.create();
    vec3.scaleAndAdd(quadPos, quadPos, quad.transform.left, 2.5);
    vec3.scaleAndAdd(quadPos, quadPos, quad.transform.up, 2.5);
    quad.transform.setPosition(quadPos[0], quadPos[1], quadPos[2]);

    const tri = this.createPrimitive("tri", new TrianglePrimitive());
    const triPos = vec3.create();
    vec3.scaleAndAdd(triPos, triPos, tri.transform.up, 2.5);
    tri.transform.setPosition(triPos[0], triPos[1], triPos[2]);
    this.scene.addEntity(tri);


    const sphere = this.createPrimitive("sphere", new SpherePrimitive());
    const spherePos = vec3.create();
    vec3.scaleAndAdd(spherePos, spherePos, sphere.transform.right, 2.5);
    sphere.transform.setPosition(spherePos[0], spherePos[1], spherePos[2]);
    this.scene.addEntity(sphere);

    await this.addMonkeyObj();

  }

  private async addMonkeyObj() {
    const obj = await fetch("assets/objs/monkey.obj");
    const text = await obj.text();
    const cubeFromObj = this.objPArser.parse(text);
    const cubePrimitive = this.createPrimitive("Cube obj", cubeFromObj);
    const renderer = cubePrimitive.getBehaviour(RenderMeshBehaviour);
    if (renderer) {
      renderer.shader = new LitShader(this.gl, new LitMaterial())
      renderer.material.color = vec4.fromValues(1, 1, 1, 1);
    }
    this.scene.addEntity(cubePrimitive);
  }

  private createPrimitive(
    name: string, meshData: MeshData,
    material = new LitMaterial(),
    shader = new LitShader(this.gl, material)): GlEntity {

    const entity = new GlEntity(name, new Transform());
    const meshRenderer: RenderMeshBehaviour = new RenderMeshBehaviour(entity, this.gl);
    const mesh = new Mesh()

    mesh.meshData = meshData

    meshRenderer.mesh = mesh;
    meshRenderer.material = material;
    meshRenderer.shader = shader;

    entity.behaviours.push(meshRenderer);

    return entity;
  }
}
