import { JsonSerializedData } from "@engine/interfaces/json-serialized-data";
import { Scene } from "./scene";
import { MeshData } from "@engine/core/mesh";

export class SceneManager {

  private static dependecies: { [key: string]: Function } = {};

  public static addDependency<T>(className: string, func: Function) {
    SceneManager.dependecies[className] = func
  }



  public static instanciateObjectFromJsonData(className: string, args?: any[]): any {
    if (this.dependecies[className]) {
      if (args && args.length > 0) {
        return this.dependecies[className](...args);
      } else {
        return this.dependecies[className]();
      }
    } else {
      console.warn("[WANR] Class Object not found! Implement Class instancing for: ", className);
    }
    return null;
  }

  public static loadScene(gl: WebGL2RenderingContext, jsonData: JsonSerializedData, scene: Scene): Scene {
    scene = scene || new Scene();
    const { meshMaps, lights, objects } = jsonData;
    const meshes: { [key: string]: MeshData; } = SceneManager.instaciateSceneMeshes(meshMaps);

    jsonData['lights'] = SceneManager.instanciateSceneLights(scene,lights);
    jsonData['objects'] = SceneManager.instaciateSceneObjects(scene, objects, meshes, gl);
    scene.fromJson(jsonData);

    return scene;
  }

  private static instaciateSceneMeshes(meshMaps: any) {
    const meshes: { [key: string]: MeshData; } = {};

    for (const data of Object.values(meshMaps) as any[]) {
      const mData = new MeshData([]);
      mData.fromJson(data);
      meshes[data['uuid']] = mData;
    }
    return meshes;
  }

  private static instanciateSceneLights(scene: Scene, lights: any) {
    return lights.map((e: any) => {
      const entity = SceneManager.instanciateObjectFromJsonData(e.type);
      entity.scene = scene;
      entity.fromJson(e);
      return entity;
    });
  }

  private static instaciateSceneObjects(scene: Scene, objects: any, meshes: { [key: string]: MeshData; }, gl: WebGL2RenderingContext) {
    return objects.map((e: any) => {
      const entity = SceneManager.instanciateObjectFromJsonData(e.type);
      entity.scene = scene;
      e.behaviours.forEach((behaviourJsonData: any) => {
        if (behaviourJsonData.mesh) {
          behaviourJsonData['meshData'] = meshes[behaviourJsonData.mesh.meshDataId];
        }
        const newBehaviour = SceneManager.instanciateObjectFromJsonData(behaviourJsonData.type, [gl]);
        if (newBehaviour) {
          newBehaviour.fromJson(behaviourJsonData);
          newBehaviour.parent = entity;
          entity.addBehaviour(newBehaviour);
        }
      });
      entity.fromJson(e);
      return entity;
    });
  }

  public static creatSceneSnapshot(scene: Scene) {
    return scene.toJsonObject();
  }


  //add instanciate light , entity and behaviour
}
