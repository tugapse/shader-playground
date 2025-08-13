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
    this.addAssets();
    this.scene.initialize();
  }

  ngOnDestroy(): void {
    this.scene.destroy();
  }

  onGlContextCreated(gl: WebGLRenderingContext) {
    this.gl = gl
  }

  addAssets() {
    if (this.started) return;
    this.started = true;
    const cube = this.createPrimitive("cube", new CubePrimitive());
    const cubeLeft = vec3.create();
    vec3.scaleAndAdd(cubeLeft,cubeLeft, cube.transform.left,2.5);
    cube.transform.setPosition(cubeLeft[0],cubeLeft[1],cubeLeft[2]);

    const sphere = this.createPrimitive("sphere", new SpherePrimitive());
    const sphereLeft = vec3.create();
    vec3.scaleAndAdd(sphereLeft,sphereLeft, cube.transform.right,2.5);
    sphere.transform.setPosition(sphereLeft[0],sphereLeft[1],sphereLeft[2]);

    const quad = this.createPrimitive("Quad", new QuadPrimitive())

    this.scene.addEntity(cube);
    this.scene.addEntity(sphere);
    this.scene.addEntity(quad);


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
