
import { Component, OnDestroy } from '@angular/core';
import { vec2, vec3 } from 'gl-matrix';

import { Editor } from '@editor/editor';
import { LightMoveBehaviour } from '../editor/behaviours/light-move';
import { RotateBehaviour } from '../editor/behaviours/rotate';
import { Camera, CanvasViewport, Color, ColorMaterial, Colors, CubemapMaterial, CubemapTexture, CubePrimitive, DephFunction, DirectionalLight,
  EngineCache, GlEntity, LitMaterial, LitShader, Mesh, MeshData, ObjectInstanciator, PlanePrimitive, PointLight,  RenderLayer,  Scene, Shader, SkyboxRenderer, SkyboxShader, SpherePrimitive, SpotLight, Texture, TexturedRendererBehaviour, UnlitMaterial, UnlitShader } from 'omega-game-engine';
import { EditorSkyboxMaterial, EditorSkyboxShader } from '@editor/core/shaders/skybox.shader';
import { EditorService } from '@editor/services/editor.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  imports: [Editor]
})
export class App implements OnDestroy {

  private gl!: WebGL2RenderingContext;
  private scene!: Scene;
  light!: DirectionalLight | SpotLight;
  torus!: GlEntity;
  needToResetCamera: boolean = false;

  constructor(private editorService: EditorService) {
    this.editorService.onRenderingContextCreated.subscribe(this.onGlContextCreated.bind(this));
    this.editorService.onSceneLoaded.subscribe(this.onEditorLoadScene.bind(this));
    Shader.SHADER_FUNCTIONS["//@INCLUDE_FUNC"] = "assets/shaders/functions/functions.frag";

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
    const torus = this.createEntity("torus", torusPrimitive, new TexturedRendererBehaviour(this.gl));
    torus.transform.scale(2, 2, 2);
    torus.transform.translate(0, 2, 0);

    torus.addBehaviour(new RotateBehaviour());
    scene.addEntity(torus);

    const cube = this.createEntity("cube", new CubePrimitive(), new TexturedRendererBehaviour(this.gl));
    const cubePos = vec3.create();
    vec3.scaleAndAdd(cubePos, cubePos, cube.transform.left, 2.5);
    vec3.scaleAndAdd(cubePos, cubePos, cube.transform.up, 2.5);
    cube.transform.setPosition(cubePos[0], cubePos[1], cubePos[2]);
    scene.addEntity(cube);

    const primitive = new SpherePrimitive();
    const sphere = this.createEntity("sphere", primitive, new TexturedRendererBehaviour(this.gl), new LitShader(this.gl, new LitMaterial()));
    // sphere.addBehaviour(new LightMoveBehaviour());
    scene.addEntity(sphere);
    // sphere.addBehaviour();
  }

  private createFloor(scene: Scene) {
    const planeEntity = new GlEntity("Floor");
    const primitive = new PlanePrimitive(10);

    const material = new LitMaterial();
    material.mainTex = EngineCache.getTexture2D( "assets/images/default/grid.jpg" , this.gl);
    material.normalTex = EngineCache.getTexture2D( "assets/images/default/grid.jpg" , this.gl);
    material.name = "Grid material";

    const shader = new LitShader(this.gl, material);
    const renderer = new TexturedRendererBehaviour(this.gl);
    renderer.shader = shader;
    renderer.mesh.meshData = primitive;
    renderer.renderLayer = RenderLayer.TRANSPARENT;
    renderer.dephMode = DephFunction.Always;
    planeEntity.addBehaviour(renderer);

    scene.addEntity(planeEntity);
  }

  private async createLights(scene: Scene) {

    const monkeyObj = await EngineCache.getMeshDataFromObj("assets/primitives/axis.obj");
    const material = new ColorMaterial();
    const shader = new Shader(this.gl, material);
    this.gl.enable(this.gl.STENCIL_TEST);
    this.gl.stencilFunc(this.gl.LEQUAL, 0, 0b1110011);



    const rendererBehaviour = new TexturedRendererBehaviour(this.gl);
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
      "Monkey", monkeyObj, new TexturedRendererBehaviour(this.gl),
      new UnlitShader(this.gl, new UnlitMaterial()));

    monkeyEntity.transform.translate(3.5, 0, 0);
    scene.addEntity(monkeyEntity);
    // monkeyEntity.transform.setParent(this.light.transform)



    const movingMokeyEntity = this.createEntity("MovingMonkey", monkeyObj, new TexturedRendererBehaviour(this.gl));
    movingMokeyEntity.transform.translate(-3.5, 0, 0);
    movingMokeyEntity.addBehaviour(new LightMoveBehaviour())
    scene.addEntity(movingMokeyEntity);

  }

  private createEntity(
    name: string, meshData: MeshData,
    meshRenderer: TexturedRendererBehaviour,
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

    if (material) {
      const wallstoneTexture = EngineCache.getTexture2D("assets/images/brick-wall/TCom_Wall_Stone3_2x2_512_albedo.jpeg", this.gl);
      const wallNormalTexture = EngineCache.getTexture2D("assets/images/brick-wall/TCom_Wall_Stone3_2x2_512_normal.jpeg", this.gl);

      material.mainTex = wallstoneTexture;
      material.normalTex = wallNormalTexture;
      material.normalMapStrength = 5;
      material.specularStrength = 1;
      material.roughness = 1;

      meshRenderer.mesh = mesh;
      meshRenderer.shader = shader || new LitShader(this.gl, material as LitMaterial);
    }


    entity.addBehaviour(meshRenderer);

    return entity;
  }

  private async createSkybox(scene: Scene, useWhiteTexture = true) {

    const renderer = new SkyboxRenderer(this.gl);
    const material = new EditorSkyboxMaterial();
    const shader = new EditorSkyboxShader(this.gl, material);
    const cubePrimitive = new CubePrimitive();
    renderer.writeToDephBuffer = false;
    renderer.renderLayer = RenderLayer.SKYBOX;
    renderer.shader = shader;
    renderer.mesh.meshData = cubePrimitive;

    material.name = "Skybox" + (useWhiteTexture ? "_white" : "");
    material.color = Colors.aliceBlue;

    const whiteTexUris = {
      right: "assets/images/white.jpg",
      left: "assets/images/white.jpg",
      up: "assets/images/white.jpg",
      bottom: "assets/images/white.jpg",
      front: "assets/images/white.jpg",
      back: "assets/images/white.jpg"
    }

    const skyboxTextures = {
      right: "assets/images/skybox/cloud/right.jpeg",
      left: "assets/images/skybox/cloud/left.jpeg",
      up: "assets/images/skybox/cloud/top.jpeg",
      bottom: "assets/images/skybox/cloud/bottom.jpeg",
      front: "assets/images/skybox/cloud/front.jpeg",
      back: "assets/images/skybox/cloud/back.jpeg"

    }
    const texture = EngineCache.getTextureCube(useWhiteTexture ? whiteTexUris : skyboxTextures, this.gl) as CubemapTexture;
    material.mainTex = texture;
    const skyboxEntity = new GlEntity(material.name);
    skyboxEntity.addBehaviour(renderer);
    const c = new Color();
    console.debug(c.className)
    scene.addEntity(skyboxEntity);
  }


}
