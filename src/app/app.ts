
import { Component, OnDestroy } from '@angular/core';
import { vec2, vec3 } from 'gl-matrix';

import { Editor } from '@editor/editor';
import { EditorService } from '@editor/editor.service';
import { LightMoveBehaviour } from '../editor/behaviours/light-move';
import { RotateBehaviour } from '../editor/behaviours/rotate';
import { Camera, CanvasViewport, ColorMaterial, Colors, CubemapMaterial, CubePrimitive, DirectionalLight, EngineCache, GlEntity, LitMaterial, LitShader, Mesh, MeshData, PlanePrimitive, PointLight, RenderMeshBehaviour, Scene, Shader, SkyboxRenderer, SkyboxShader, SpotLight, UnlitMaterial, UnlitShader } from 'omega-game-engine';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  imports: [Editor]
})
export class App implements OnDestroy {

  private gl!: WebGL2RenderingContext;
  private scene!: Scene;
  light!: DirectionalLight|SpotLight;
  torus!: GlEntity;
  needToResetCamera: boolean = false;

  constructor(private editorService: EditorService) {
    this.editorService.onRenderingContextCreated.subscribe(this.onGlContextCreated.bind(this));
    this.editorService.onSceneLoaded.subscribe(this.onEditorLoadScene.bind(this));
  }

  onEditorLoadScene(scene: Scene): any {
    this.scene = scene;
    this.initializeScene(scene);
  }

  ngOnDestroy(): void {
    this.scene?.destroy();
  }

  private async onGlContextCreated(gl: WebGL2RenderingContext) {
    this.gl = gl
    if (!this.scene) {
      await this.createNewScene();
    }
  }


  async createNewScene() {
    const scene = new Scene();
    scene.name = "Main Scene";
    await this.loadAssets(scene);
    this.needToResetCamera = true;
    this.editorService.loadScene(scene);
  }

  private async loadAssets(scene: Scene) {
    await this.createFloor(scene);
    await this.otherObjetcs(scene);
    await this.createSkybox(scene);
    await this.createLights(scene);
    await this.addMonkeyObj(scene);

  }

  private initializeScene(scene: Scene): any {
    this.scene = scene
    this.scene.initialize();
    this.setupCamera();
  }

  private setupCamera() {
    if (!Camera.mainCamera) return;
    Camera.mainCamera.updateInEditor = true;
    Camera.mainCamera.update(0);
    Camera.mainCamera.aspectRatio = CanvasViewport.rendererWidth / CanvasViewport.rendererHeight;

  }


  private async otherObjetcs(scene: Scene) {

    const torusPrimitive = await EngineCache.getMeshDataFromObj("assets/primitives/torus.obj");
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

    const primitive = new PlanePrimitive(5);
    const sphere = this.createEntity("sphere", primitive, new RenderMeshBehaviour(this.gl),new UnlitShader(this.gl,new UnlitMaterial()));
    // sphere.addBehaviour(new LightMoveBehaviour());
    scene.addEntity(sphere);
    // sphere.addBehaviour();
  }

  private createFloor(scene: Scene) {
    const plane = this.createEntity("plane", new PlanePrimitive(1), new RenderMeshBehaviour(this.gl));

    const renderer = plane.getBehaviour(RenderMeshBehaviour) as RenderMeshBehaviour;
    if (renderer && renderer.shader) {
      const material = renderer.shader.material as LitMaterial;
      material.normalMapStrength = 1;
      material.specularStrength = 2;
      material.roughness = 0.8;
      material.uvScale = vec2.fromValues(50, 50)
    }
    plane.transform.translate(0, -2, 0);
    // plane.transform.rotate(270, 0, 0);
    plane.transform.scale(500, 500, 500);
    scene.addEntity(plane);
  }

  private async createLights(scene: Scene) {

    const monkeyObj = await EngineCache.getMeshDataFromObj("assets/primitives/axis.obj");
    const material = new ColorMaterial();
    const shader = new Shader(this.gl, material);
    // shader.fragUri = "assets/shaders/editor/handle/handle.frag";
    // shader.vertexUri = "assets/shaders/editor/handle/handle.vert";
    shader.recompile();
    // shader.initialize();


    const rendererBehaviour = new RenderMeshBehaviour(this.gl);
    rendererBehaviour.shader = shader;
    rendererBehaviour.mesh.meshData = monkeyObj;

    const dlight = new DirectionalLight("Directional light");
    dlight.transform.rotate(0.7, 1, 0.2);

    dlight.color = Colors.cadetBlue;
    dlight.addBehaviour(new LightMoveBehaviour())
    dlight.addBehaviour(rendererBehaviour)

    const plight = new PointLight("Point light");
    plight.transform.translate(0, 0, 0);
    plight.attenuation = { constant: 1, linear: 0.1, quadratic: 0.002 };
    plight.color = Colors.red;

    const spotLight = new SpotLight("Spot light 1");
    spotLight.attenuation = { constant: 1, linear: 0.2, quadratic: 0.008 };
    spotLight.coneAngles = { inner: 15, outer: 20 }
    spotLight.color = Colors.azure;
    spotLight.addBehaviour(new LightMoveBehaviour());
    this.light = spotLight;

    scene.addEntity(plight);
    scene.addEntity(spotLight);
    scene.addEntity(dlight);
  }

  private async addMonkeyObj(scene: Scene) {

    const monkeyObj = await EngineCache.getMeshDataFromObj("assets/objs/monkey.obj");
    const monkeyEntity = this.createEntity(
      "Monkey", monkeyObj, new RenderMeshBehaviour(this.gl),
      new LitShader(this.gl, new LitMaterial()));

    monkeyEntity.transform.translate(3.5, 0, 0);
    scene.addEntity(monkeyEntity);
    // monkeyEntity.transform.setParent(this.light.transform)



    const movingMokeyEntity = this.createEntity("MovingMonkey", monkeyObj, new RenderMeshBehaviour(this.gl));
    movingMokeyEntity.transform.translate(-3.5, 0, 0);
    movingMokeyEntity.addBehaviour(new LightMoveBehaviour())
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

    mesh.meshData = meshData;

    if (!shader && !material)
      material = new LitMaterial();
    else if (shader?.material)
      material = shader.material as LitMaterial;
    material!.mainTexUrl = "assets/images/brick-wall/TCom_Wall_Stone3_2x2_512_albedo.jpeg";
    material!.normalTexUrl = "assets/images/brick-wall/TCom_Wall_Stone3_2x2_512_normal.jpeg";
    material!.normalMapStrength = 5;
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
    material.name = "Skybox"
    const shader = new SkyboxShader(this.gl, material);
    const cube = this.createEntity("Skybox", cubePrimitive, new SkyboxRenderer(this.gl), shader);

    scene.addEntity(cube);
  }


}
