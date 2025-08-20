import { JsonSerializedData } from "@engine/interfaces/json-serialized-data";
import { Scene } from "./scene";

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

  public static loadScene(jsonData: JsonSerializedData): Scene {
    const scene = new Scene();
    debugger
    scene.fromJson(jsonData);
    return scene;
  }

  public static creatSceneSnapshot(scene: Scene) {
    return scene.toJsonObject();
  }
}
