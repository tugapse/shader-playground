import { Texture } from "@engine/textures/texture";
import { MeshData } from "./mesh";
import { ObjParser } from "@engine/parsers/obj-parser";


interface StorageSpaces {
  shaderCode: { [key: string]: string };
  textures: { [key: string]: Texture };
  meshs: { [key: string]: MeshData };
}
export abstract class EngineCache {

  private static __cache: StorageSpaces = {
    shaderCode:{},
    textures: {},
    meshs: {}
  }
  private static objPArser: ObjParser = new ObjParser;

  public static getTexture2D(uri: string, gl: WebGL2RenderingContext | WebGL2RenderingContext): Texture {
    let result = EngineCache.__cache.textures[uri]
    if (!result) {
      result = new Texture(gl, uri);
      result.load();
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

  public static async loadShaderSource(uri: string) : Promise<string> {
    let result = EngineCache.__cache.shaderCode[uri];
    if (!result) {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to load shader: ${uri}`);
      }
      result = await response.text();
    }
    return result;
  }
}
