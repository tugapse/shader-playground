import { Texture } from "@engine/materials/texture";
import { MeshData } from "./mesh";
import { ObjParser } from "@engine/parsers/obj-parser";


interface StorageSpaces {
  textures: { [key: string]: Texture },
  meshs: { [key: string]: MeshData },
}
export abstract class EngineCache {

  private static __cache: StorageSpaces = {
    textures: {},
    meshs: {}
  }
  private static objPArser: ObjParser = new ObjParser;

  public static getTexture(uri: string, gl: WebGL2RenderingContext|WebGLRenderingContext): Texture {
    let result = EngineCache.__cache.textures[uri]
    if (!result) {
      result = new Texture(gl);
      result.load(uri);
      EngineCache.__cache.textures[uri] = result;
    }
    return result;
  }

  public static async getMeshDataFromObj(uri: string): Promise<MeshData> {
    let result = EngineCache.__cache.meshs[uri];
    if (!result) {
      const obj = await fetch(uri);
      const text = await obj.text();
      result = EngineCache.objPArser.parse(text);
      EngineCache.__cache.meshs[uri] = result;
    }
    return result;
  }
}
