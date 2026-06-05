
import { Component, OnDestroy } from '@angular/core';
import { vec3 } from 'gl-matrix';

import { EditorSkyboxMaterial, EditorSkyboxShader } from '@editor/core/shaders/skybox.shader';
import { Editor } from '@editor/editor';
import { EditorService } from '@editor/services/editor.service';
import {
  Camera, CanvasViewport,
  Colors, CubemapMaterial,
  CubePrimitive,
  DirectionalLight,
  EngineCache, GlEntity,
  LitMaterial, LitShader, Mesh, MeshData, MeshRendererBehaviour, ObjectInstanciator,
  PlanePrimitive, PointLight,
  Scene,
  Shader, SkyboxRenderer, SkyboxShader, SpherePrimitive, SpotLight
} from '@engine';

import { SunBehaviour } from '../editor/behaviours/light-move';
import { RotateBehaviour } from '../editor/behaviours/rotate';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  standalone: true,
  imports: [RouterModule]
})
export class App implements OnDestroy {

  private gl!: WebGL2RenderingContext;
  private scene!: Scene;
  light!: DirectionalLight | SpotLight;
  torus!: GlEntity;
  needToResetCamera: boolean = false;
  shadowMapTexture: any;
  sun!: DirectionalLight;

  constructor(private editorService: EditorService) {
    this.editorService.onRenderingContextCreated.subscribe(this.onGlContextCreated.bind(this));
    this.editorService.onSceneLoaded.subscribe(this.onEditorLoadScene.bind(this));
    Shader.SHADER_FUNCTIONS = {
      "@INCLUDE_LIGHT_FUNC": "assets/shaders/functions/light.frag",
      "@INCLUD_FUNC": "assets/shaders/functions/functions.frag",
    };

    ObjectInstanciator.addDependency("EditorSkyboxShader", EditorSkyboxShader.instanciate);
    ObjectInstanciator.addDependency("EditorSkyboxMaterial", () => new EditorSkyboxMaterial);

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
    await this.createLights(scene);
    await this.otherObjetcs(scene);
    await this.addMonkeyObj(scene);
    await this.createSkybox(scene);
    await this.createFloor(scene);
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
    const torus = this.createEntity("torus", torusPrimitive, new MeshRendererBehaviour(this.gl));
    torus.transform.scale(2, 2, 2);
    torus.transform.translate(0, 2, 0);
    torus.addBehaviour(new RotateBehaviour());
    scene.addEntity(torus);

    const cube = this.createEntity("cube", new CubePrimitive(), new MeshRendererBehaviour(this.gl));
    const cubePos = vec3.create();
    vec3.scaleAndAdd(cubePos, cubePos, cube.transform.left, 2.5);
    vec3.scaleAndAdd(cubePos, cubePos, cube.transform.up, 2.5);
    cube.transform.setWorldPosition(cubePos[0], cubePos[1], cubePos[2]);
    scene.addEntity(cube);

    const primitive = new SpherePrimitive();
    const sphere = this.createEntity("sphere", primitive, new MeshRendererBehaviour(this.gl), new LitShader(this.gl, new LitMaterial()));
    scene.addEntity(sphere);
  }

  private async createFloor(scene: Scene) {
    const primitive = new PlanePrimitive(50);
    const material = new LitMaterial();

    const shader = new LitShader(this.gl, material);
    const renderer = new MeshRendererBehaviour(this.gl);
    renderer.name = "Renderer";

    material.mainTex = await EngineCache.getTexture2D("assets/images/wood-texture.jpg", this.gl);
    material.normalTex = await EngineCache.getTexture2D("assets/images/wood-normal1.jpg", this.gl);


    renderer.shader = shader;
    renderer.mesh.meshData = primitive;

    const planeEntity = new GlEntity("Floor");
    planeEntity.addBehaviour(renderer);
    scene.addEntity(planeEntity);

    // material.mainTex = this.shadowMapTexture;
  }

  private async createLights(scene: Scene) {

    const dlight = new DirectionalLight("Directional light");
    dlight.color = Colors.white;
    dlight.addBehaviour(new SunBehaviour())
    dlight.updateInEditor = true;
    this.sun = dlight;

    const plight = new PointLight("Point light");
    plight.attenuation = { constant: 1, linear: 0.1, quadratic: 0.002 };
    plight.color = Colors.red;

    const spotLight = new SpotLight("Spot light 1");
    spotLight.attenuation = { constant: 1, linear: 0.2, quadratic: 0.008 };
    spotLight.coneAngles = { inner: 15, outer: 20 }
    spotLight.color = Colors.azure;

    // scene.addEntity(new Light("Ambient light"));
    // scene.addEntity(plight);
    // scene.addEntity(spotLight);
    scene.addEntity(dlight);


    this.light = dlight;
  }

  private async addMonkeyObj(scene: Scene) {


    const monkeyObj = await EngineCache.getMeshDataFromObj("assets/objs/monkey.obj");
    const monkeyEntity = this.createEntity(
      "Monkey", monkeyObj, new MeshRendererBehaviour(this.gl),
      new LitShader(this.gl, new LitMaterial()));

    monkeyEntity.transform.translate(3.5, 0, 0);
    scene.addEntity(monkeyEntity);



    const movingMokeyEntity = this.createEntity("MovingMonkey", monkeyObj, new MeshRendererBehaviour(this.gl));
    scene.addEntity(movingMokeyEntity);

    // movingMokeyEntity.transform.setParent(this.light.transform)
  }

  private createEntity(
    name: string, meshData: MeshData,
    meshRenderer: MeshRendererBehaviour,
    shader?: Shader,
    material?: LitMaterial
  ): GlEntity {

    const entity = new GlEntity(name);
    const mesh = new Mesh()

    mesh.meshData = meshData;

    if (!shader && !material) {
      material = new LitMaterial();
    }
    else if (shader?.material)
      material = shader.material as LitMaterial;


    if (material) {
      const wallstoneTexture = EngineCache.getTexture2D("assets/images/brick-wall/TCom_Wall_Stone3_2x2_512_albedo.jpeg", this.gl);
      const wallNormalTexture = EngineCache.getTexture2D("assets/images/brick-wall/TCom_Wall_Stone3_2x2_512_normal.jpeg", this.gl);

      material.name = "Lit Material";
      material.mainTex = wallstoneTexture;
      material.normalTex = wallNormalTexture;
      material.normalMapStrength = 1;
      material.specularStrength = 0.2;
      material.roughness = 0.5;

      meshRenderer.mesh = mesh;
      meshRenderer.shader = shader || new LitShader(this.gl, material as LitMaterial);
      meshRenderer.shader.name = "Lit Shader";
    }

    meshRenderer.name = meshRenderer.name || "Renderer"
    entity.addBehaviour(meshRenderer);

    return entity;
  }

  private async createSkybox(scene: Scene, useWhiteTexture = true) {

    const renderer = new SkyboxRenderer(this.gl);
    const material = new CubemapMaterial();
    const shader = new SkyboxShader(this.gl, material);
    const cubePrimitive = new SpherePrimitive();
    renderer.writeToDephBuffer = false;
    renderer.shader = shader;
    renderer.mesh.meshData = cubePrimitive;
    renderer.sunLight = this.sun;

    material.name = "Skybox" + (useWhiteTexture ? "_white" : "");
    

    const skyboxTextures = {
      right: "assets/images/skybox/blue/right.jpeg",
      left: "assets/images/skybox/blue/left.jpeg",
      up: "assets/images/skybox/blue/top.jpeg",
      bottom: "assets/images/skybox/blue/bottom.jpeg",
      front: "assets/images/skybox/blue/front.jpeg",
      back: "assets/images/skybox/blue/back.jpeg"

    }
    const texture = EngineCache.getTextureCube(skyboxTextures, this.gl);
    material.mainTex = texture;
    const skyboxEntity = new GlEntity(material.name);

    skyboxEntity.addBehaviour(renderer);
    scene.addEntity(skyboxEntity);
  }


}
