import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Canvas } from "../components/canvas/canvas";
import { Scene } from '../engine/core/scene';
import { Mesh } from '../engine/core/mesh';
import { Shader } from '../engine/core/shader';
import { GlEntity } from '../engine/core/entity';
import { Vec3 } from '../engine/core/vec';
import { RenderMeshBehaviour } from '../engine/behaviours/render-mesh-behaviour';
import { QuadPrimitive } from '../engine/primitives/quad';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  imports: [Canvas]
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('glCanvas') glCanvas!: ElementRef<HTMLCanvasElement>;

  private gl!: WebGLRenderingContext;
  public scene!:Scene;
  private started = false;

  ngAfterViewInit(): void {
    this.scene = new Scene();
    this.addAssets();
  }

  ngOnDestroy(): void {
    this.scene.destroy();
  }

  onGlContextCreated(gl:WebGLRenderingContext) {
    this.gl = gl
  }

  addAssets() {
    if(this.started ) return;
    this.started = true;

    const quad = new GlEntity("Quad",Vec3.ZERO);
    const meshRenderer:RenderMeshBehaviour = new RenderMeshBehaviour(quad, this.gl);

    const mesh = new Mesh()
    mesh.shader = new Shader(this.gl);
    mesh.meshData = new QuadPrimitive();
    meshRenderer.mesh = mesh;


    quad.behaviours.push(meshRenderer);
    this.scene.addEntity(quad);

    this.scene.initialize();
    this.scene.name = "Main Scene";

  }
}
