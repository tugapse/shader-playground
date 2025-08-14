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
import { UnlitShader } from '@engine/shaders/unlit-shader';
import { CubePrimitive } from '@engine/primitives/cube';
import { SpherePrimitive } from '@engine/primitives/sphere';
import { vec3 } from 'gl-matrix';
import { ObjParser } from '@engine/parsers/obj-parser';
import { TrianglePrimitive } from '@engine/primitives/triangle';

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
  private objPArser!:ObjParser

  ngAfterViewInit(): void {
    this.objPArser = new ObjParser();
    this.scene = new Scene();
    this.scene.name = "Main Scene";
    this.addAssets().then(()=>this.scene.initialize());
  }

  ngOnDestroy(): void {
    this.scene.destroy();
  }

  onGlContextCreated(gl: WebGLRenderingContext) {
    this.gl = gl
  }

  async addAssets() {
    if (this.started) return;
    this.started = true;

    const cube = this.createPrimitive("cube", new CubePrimitive());
    const cubePos = vec3.create();
    vec3.scaleAndAdd(cubePos,cubePos, cube.transform.left,2.5);
    cube.transform.setPosition(cubePos[0],cubePos[1],cubePos[2]);

    const quad = this.createPrimitive("quad", new QuadPrimitive());
    const quadPos = vec3.create();
    vec3.scaleAndAdd(quadPos,quadPos, quad.transform.left,2.5);
    vec3.scaleAndAdd(quadPos,quadPos, quad.transform.up,2.5);
    quad.transform.setPosition(quadPos[0],quadPos[1],quadPos[2]);

    const tri = this.createPrimitive("tri", new TrianglePrimitive());
    const triPos = vec3.create();
    vec3.scaleAndAdd(triPos,triPos, tri.transform.up,2.5);
    tri.transform.setPosition(triPos[0],triPos[1],triPos[2]);


    const sphere = this.createPrimitive("sphere", new SpherePrimitive());
    const spherePos = vec3.create();
    vec3.scaleAndAdd(spherePos,spherePos, sphere.transform.right,2.5);
    sphere.transform.setPosition(spherePos[0],spherePos[1],spherePos[2]);

    await this.addMonkeyObj();


    this.scene.addEntity(cube);
    this.scene.addEntity(sphere);
    this.scene.addEntity(quad);
    this.scene.addEntity(tri);


  }

  private async addMonkeyObj() {
    const obj = await fetch("assets/objs/monkey.obj");
    const text = await obj.text();
    const cubeFromObj = this.objPArser.parse(text);
    const cubeObj = this.createPrimitive("Cube obj", cubeFromObj);
    this.scene.addEntity(cubeObj);
  }

  private createPrimitive(name: string, meshData: MeshData,
    material = new UnlitMaterial(), shader = new UnlitShader(this.gl, material)): GlEntity {

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
