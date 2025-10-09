import { EngineCache, EntityBehaviour, GlEntity, JsonSerializable, JsonSerializedData, MeshData, ObjectInstanciator,  Transform } from "@engine";
import { EditorScene as Scene } from '@editor/overrides/scene';

/**
  A static class responsible for managing the loading, instantiation, and serialization of scenes and their components.
 */
export class SceneManager {




  /**
    Loads a scene from a JSON data object.

   * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
   * @param {JsonSerializedData} jsonData - The JSON data representing the scene.
   * @param {Scene} [scene] - An optional existing Scene instance to load into.
   * @returns {Scene} - The loaded or newly created Scene instance.
   */
  public static loadScene(gl: WebGL2RenderingContext, jsonData: JsonSerializedData, scene?: Scene): Scene {

    EngineCache.clear();
    scene = scene || new Scene();
    scene.setGlRenderingContext(gl);

    const { meshMaps, objects, textureMaps } = jsonData;
    const meshes: { [key: string]: MeshData; } = SceneManager.instaciateSceneMeshes(meshMaps);
    SceneManager.instaciateAndLoadSceneTextures(textureMaps, gl);

    jsonData['objects'] = SceneManager.instaciateSceneObjects(scene, objects, meshes, gl);
    scene.fromJson(jsonData);

    return scene;
  }

  /**
  Instantiates mesh data objects from the scene JSON data.
 * @private

 * @param {any} meshMaps - The raw mesh data from the JSON.
 * @returns {{ [key: string]: MeshData }} - A map of mesh UUIDs to MeshData instances.
 */
  private static instaciateAndLoadSceneTextures(texturesMaps: any, gl: WebGL2RenderingContext): void {
    return
    for (const textureJsonData of Object.values(texturesMaps) as any[]) {
      if (textureJsonData.url) {
        EngineCache.getTexture2D(textureJsonData.url, gl);
      } else if (textureJsonData.urls) {
        const keys = textureJsonData.urls.split("|");
        EngineCache.getTextureCube({
          right: keys[0], left: keys[1],
          up: keys[2], bottom: keys[3],
          front: keys[4], back: keys[5],
        }, gl);
      }
    }
  }
  /**
    Instantiates mesh data objects from the scene JSON data.
   * @private

   * @param {any} meshMaps - The raw mesh data from the JSON.
   * @returns {{ [key: string]: MeshData }} - A map of mesh UUIDs to MeshData instances.
   */
  private static instaciateSceneMeshes(meshMaps: any): { [key: string]: MeshData } {
    const meshes: { [key: string]: MeshData } = {};

    for (const data of Object.values(meshMaps) as any[]) {
      const mData = new MeshData([]);
      mData.fromJson(data);
      meshes[data['uuid']] = mData;
    }
    return meshes;
  }

  /**
    Instantiates and initializes all entities and their behaviours in the scene.
   * @private

   * @param {Scene} scene - The scene instance.
   * @param {any} objects - The raw entity data from the JSON.
   * @param {{ [key: string]: MeshData }} meshes - A map of instantiated meshes.
   * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
   * @returns {any[]} - An array of instantiated entity objects.
   */
  private static instaciateSceneObjects(scene: Scene, objects: JsonSerializable[], meshes: { [key: string]: MeshData }, gl: WebGL2RenderingContext): any[] {
    const instanciatedTransforms: { [key: string]: Transform } = {};

    objects.forEach((ob: JsonSerializable) => {
      this.instanciateEntities(ob, instanciatedTransforms);
      this.instanciateBehaviours(ob, scene, meshes, gl);
    }
    );
    debugger
    return objects.map((e: any) => e.entity);
  }

  /**
    Links parent and child transforms based on their UUIDs.

   * @param {{ [key: string]: Transform }} transforms - A map of all instantiated transforms.
   * @param {any} entities - An array of raw entity data.
   * @returns {void}
   */
  static prepareTransforms(transforms: { [key: string]: Transform }, entities: any): void {
    for (const ent of entities) {
      if (ent.transform.parent) {
        ent.entity.transform.setParent(transforms[ent.transform.parent]);
      }
    }
  }

  /**
    Creates a snapshot of the current scene state in a serializable format.

   * @param {Scene} scene - The scene to snapshot.
   * @returns {JsonSerializedData} - A JSON data object representing the scene.
   */
  public static creatSceneSnapshot(scene: Scene): JsonSerializedData {
    return scene.toJsonObject();
  }



  private static instanciateBehaviours(jsonObject: JsonSerializedData, scene: Scene, meshes: { [key: string]: MeshData }, gl: WebGL2RenderingContext) {
    jsonObject["entity"].scene = scene;

    jsonObject["behaviours"].forEach((behaviourJsonData: any) => {
      if (behaviourJsonData.mesh) {
        behaviourJsonData['meshData'] = meshes[behaviourJsonData.mesh.meshDataId];
      }
      const newBehaviour = ObjectInstanciator.instanciateObjectFromJsonData<EntityBehaviour>(behaviourJsonData.className || behaviourJsonData.type, [gl]);
      if (newBehaviour) {
        newBehaviour.fromJson(behaviourJsonData);
        newBehaviour.parent = jsonObject["entity"];
        jsonObject["entity"].addBehaviour(newBehaviour);
      }
    });
  }

  private static instanciateEntities(jsonObject: JsonSerializedData, instanciatedTransforms: { [key: string]: Transform }): void {
    const entity = ObjectInstanciator.instanciateObjectFromJsonData<GlEntity>(jsonObject["className"]) || new GlEntity(jsonObject["name"]);
    entity.fromJson(jsonObject);
    instanciatedTransforms[entity.transform.uuid] = entity.transform;
    jsonObject['entity'] = entity;

  }
}
