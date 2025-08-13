import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Canvas } from "./components/canvas/canvas";
import { Scene } from '../engine/core/scene';
import { Mesh } from '../engine/core/mesh';
import { Shader } from '../engine/shaders/shader';
import { GlEntity } from '../engine/core/entity';
import { RenderMeshBehaviour } from '../engine/behaviours/render-mesh-behaviour';
import { QuadPrimitive } from '../engine/primitives/quad';
import { Transform } from '../engine/core/transform';
import { ColorMaterial } from '../engine/materials/color-material';
import { UnlitShader } from '../engine/shaders/unlit-shader';
import { UnlitMaterial } from '../engine/materials/unlit-material';

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
    mesh.meshData = new QuadPrimitive();


    const material = new UnlitMaterial()

    meshRenderer.mesh = mesh;
    meshRenderer.material = material;
    meshRenderer.shader = new UnlitShader(this.gl, material);;

    quad.behaviours.push(meshRenderer);

    this.scene.addEntity(quad);

    this.scene.initialize();
    this.scene.name = "Main Scene";

  }
}
