import { GlEntity } from "./entity";
import { Camera } from "./camera";
import { DirectionalLight, Light, PointLight, SpotLight } from "./light";
import { Shader } from "@engine/shaders/shader";
import { RenderMeshBehaviour } from "@engine/behaviours/renderer/render-mesh-behaviour";
import { SkyboxRenderer } from "@engine/behaviours/renderer/skybox-renderer";
import { Scene } from "./scene";

export class SceneManager {

  private static dependecies: { [key: string]: Function } = {};

  public static addDependency<T>(className: string, func: Function) {
    SceneManager.dependecies[className] = func
  }

  public static registerDependencies() {
    // Entities
    SceneManager.addDependency(GlEntity.name, GlEntity.instanciate)
    SceneManager.addDependency(Camera.name, Camera.instanciate);
    SceneManager.addDependency(Light.name, Light.instanciate);
    SceneManager.addDependency(PointLight.name, PointLight.instanciate);
    SceneManager.addDependency(SpotLight.name, SpotLight.instanciate);
    SceneManager.addDependency(DirectionalLight.name, DirectionalLight.instanciate);
    // shaders

    SceneManager.addDependency(Shader.name, Shader.instanciate)
    SceneManager.addDependency(RenderMeshBehaviour.name, RenderMeshBehaviour.instanciate)
    SceneManager.addDependency(SkyboxRenderer.name, SkyboxRenderer.instanciate)
    // SceneManager.addDependency(Shader.name, Shader.instanciate)
    // SceneManager.addDependency(Shader.name, Shader.instanciate)



  }

  public static instanciateObjectFromJsonData(className: string, args?: any[]): any {
    if (this.dependecies[className]) {
      if (args && args.length > 0) {
        return this.dependecies[className](...args);
      } else {
        return this.dependecies[className]();
      }
    }
    return null;
  }

  public static loadScene(): Scene {
    const scene = new Scene();
    // const { meshMaps, lights, objects } = jsonObject;
    // const meshes: { [key: string]: MeshData } = {};
    return scene;
  }
}
