import { JsonSerializedData } from "@engine/interfaces/json-serialized-data";
import { Scene } from "./scene";
import { MeshData } from "@engine/core/mesh";
import { GlEntity } from "./entity";
import { Transform } from "@engine/core/transform";

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

  public static loadScene(gl: WebGL2RenderingContext, jsonData: JsonSerializedData, scene?: Scene): Scene {
    scene = scene || new Scene();
    const { meshMaps, lights, objects } = jsonData;
    const meshes: { [key: string]: MeshData; } = SceneManager.instaciateSceneMeshes(meshMaps);

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


  private static instaciateSceneObjects(scene: Scene, objects: any, meshes: { [key: string]: MeshData; }, gl: WebGL2RenderingContext) {
    const transforms: { [key: string]: Transform } = {};

    const entities: any[] = objects.map((e: any) => {
      e['entity'] = SceneManager.instanciateObjectFromJsonData(e.type);
      const enTransform = e['entity'].transform as Transform;
      enTransform.fromJson(e['transform']);
      transforms[enTransform.uuid] = enTransform;
      return e;
    });

    this.prepareTransforms(transforms, entities);
    objects.forEach((e: any) => {

      e.entity.scene = scene;

      e.behaviours.forEach((behaviourJsonData: any) => {
        if (behaviourJsonData.mesh) {
          behaviourJsonData['meshData'] = meshes[behaviourJsonData.mesh.meshDataId];
        }
        const newBehaviour = SceneManager.instanciateObjectFromJsonData(behaviourJsonData.type, [gl]);
        if (newBehaviour) {
          newBehaviour.fromJson(behaviourJsonData);
          newBehaviour.parent = e.entity;
          e.entity.addBehaviour(newBehaviour);
        }
      });
      e.entity.fromJson(e);
    });
    return objects.map((e: any) => e.entity);
  }
  static prepareTransforms(transforms: any, entities: any) {
    for (const ent of entities) {
      if (ent.transform.parent) {
        ent.entity.transform.setParent(transforms[ent.transform.parent]);
      }
    }
  }

  public static creatSceneSnapshot(scene: Scene) {
    return scene.toJsonObject();
  }


  //add instanciate light , entity and behaviour
}
