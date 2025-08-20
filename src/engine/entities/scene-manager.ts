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
    }
    return null;
  }

  public static loadScene(gl: WebGL2RenderingContext, jsonData: JsonSerializedData): Scene {
    const scene = new Scene();
    const { meshMaps, lights, objects } = jsonData;
    const meshes: { [key: string]: MeshData } = {};

    for (const data of Object.values(meshMaps) as any[]) {
      const mData = new MeshData([]);
      mData.fromJson(data);
      meshes[data['uuid']] = mData;
    }

    const newObjects = objects.map((e: any) => {
      const entity = SceneManager.instanciateObjectFromJsonData(e.type);
      e.behaviours.forEach((behaviourJsonData: any) => {
        // get the actual mesh from id
        if (behaviourJsonData.mesh) {
          behaviourJsonData['meshData'] = meshes[behaviourJsonData.mesh.meshDataId];
        }
        const newBehaviour = SceneManager.instanciateObjectFromJsonData(behaviourJsonData.type, [gl]);
        if (newBehaviour) {
          newBehaviour.fromJson(behaviourJsonData);
          newBehaviour.parent = entity;
          entity.addBehaviour(newBehaviour);
        } else {
          console.warn("Implement behaviour instance");
        }
      });
      entity.fromJson(e);
      return entity;
    });

    const newLights = lights.map((e: any) => {
      const entity = SceneManager.instanciateObjectFromJsonData(e.type);
      entity.fromJson(e);
      return entity;
    });

    jsonData['lights'] = newLights;
    jsonData['objects'] = newObjects;
    scene.fromJson(jsonData);
    scene.name = "FromManager"
    return scene;
  }

  public static creatSceneSnapshot(scene: Scene) {
    return scene.toJsonObject();
  }
}
