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
    const exampleObjContent = `
# Blender 4.5.1 LTS
# www.blender.org
mtllib Untitled100.mtl
o Cube
v 1.000000 1.000000 -1.000000
v 1.000000 -1.000000 -1.000000
v 1.000000 1.000000 1.000000
v 1.000000 -1.000000 1.000000
v -1.000000 1.000000 -1.000000
v -1.000000 -1.000000 -1.000000
v -1.000000 1.000000 1.000000
v -1.000000 -1.000000 1.000000
vn -0.0000 1.0000 -0.0000
vn -0.0000 -0.0000 1.0000
vn -1.0000 -0.0000 -0.0000
vn -0.0000 -1.0000 -0.0000
vn 1.0000 -0.0000 -0.0000
vn -0.0000 -0.0000 -1.0000
vt 0.625000 0.500000
vt 0.875000 0.500000
vt 0.875000 0.750000
vt 0.625000 0.750000
vt 0.375000 0.750000
vt 0.625000 1.000000
vt 0.375000 1.000000
vt 0.375000 0.000000
vt 0.625000 0.000000
vt 0.625000 0.250000
vt 0.375000 0.250000
vt 0.125000 0.500000
vt 0.375000 0.500000
vt 0.125000 0.750000
s 0
usemtl Material
f 1/1/1 5/2/1 7/3/1 3/4/1
f 4/5/2 3/4/2 7/6/2 8/7/2
f 8/8/3 7/9/3 5/10/3 6/11/3
f 6/12/4 2/13/4 4/5/4 8/14/4
f 2/13/5 1/1/5 3/4/5 4/5/5
f 6/11/6 5/10/6 1/1/6 2/13/6
`;
    const cube = this.createPrimitive("cube", new CubePrimitive());
    const cubeLeft = vec3.create();
    vec3.scaleAndAdd(cubeLeft,cubeLeft, cube.transform.left,2.5);
    cube.transform.setPosition(cubeLeft[0],cubeLeft[1],cubeLeft[2]);

    const sphere = this.createPrimitive("sphere", new SpherePrimitive());
    const sphereLeft = vec3.create();
    vec3.scaleAndAdd(sphereLeft,sphereLeft, cube.transform.right,2.5);
    sphere.transform.setPosition(sphereLeft[0],sphereLeft[1],sphereLeft[2]);

    const cubeFromObj = this.objPArser.parse(exampleObjContent);
    const quad = this.createPrimitive("Cube obj", cubeFromObj)

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
