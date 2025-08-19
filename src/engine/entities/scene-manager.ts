import { Scene } from "./scene";

export class SceneManager {
  constructor() {

  }

  public loadScene(sceneJsonData: { [key: string]: any }): Scene {
    const result = new Scene();

    return result;
  }

  public saveSceneToJson(scene:Scene):string{
    return "";
  }
}
