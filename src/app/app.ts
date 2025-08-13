import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { RenderMeshBehaviour } from '../engine/behaviours/render-mesh-behaviour';
import { Mesh } from '../engine/core/mesh';
import { Transform } from '../engine/core/transform';
import { UnlitMaterial } from '../engine/materials/unlit-material';
import { QuadPrimitive } from '../engine/primitives/quad';
import { Shader } from '../engine/shaders/shader';
import { Canvas } from "./components/canvas/canvas";

import { Scene } from '@engine/entities/scene';
import { GlEntity } from '@engine/entities/entity';
import { UnlitShader } from '@engine/shaders/unlit-shader';
import { CubePrimitive } from '@engine/primitives/cube';

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
    this.addAssets();
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

    const quad = new GlEntity("Quad", new Transform());
    const meshRenderer: RenderMeshBehaviour = new RenderMeshBehaviour(quad, this.gl);
    const mesh = new Mesh()
    mesh.meshData = new CubePrimitive();


    const material = new UnlitMaterial()

    meshRenderer.mesh = mesh;
    meshRenderer.material = material;
    meshRenderer.shader = new UnlitShader(this.gl, material);

    quad.behaviours.push(meshRenderer);

    this.scene.addEntity(quad);

    this.scene.initialize();
    this.scene.name = "Main Scene";

  }
}
