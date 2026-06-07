import { ICubemapSides } from "../interfaces/cubemap.interface";
import { ObjParser } from "../parsers/obj-parser";
import { CubemapTexture } from "../textures";
import { Texture } from "../textures/texture";
import { MeshData } from "./mesh";

/**
  The structure for storing cached assets.
 * @interface StorageSpaces
 */
interface StorageSpaces {
  /**
    A map for caching shader source code strings.
   * @type {{ [key: string]: string }}
   */
  shaderCode: { [key: string]: string };
  /**
    A map for caching textures.
   * @type {{ [key: string]: Texture | CubemapTexture }}
   */
  textures: { [key: string]: Texture | CubemapTexture };
  /**
    A map for caching parsed mesh data.
   * @type {{ [key: string]: MeshData }}
   */
  meshs: { [key: string]: MeshData };
  textureCounter: { [key: string]: number };

  generic: { [key: string]: any };
}

/**
  A static class that manages the caching of various engine assets such as textures, meshes, and shader code.
 * @abstract
 */
export abstract class EngineCache {
  /**
    The private cache instance.
   * @private

   * @type {StorageSpaces}
   */
  private static __cache: StorageSpaces = {
    shaderCode: {},
    textures: {},
    meshs: {},
    textureCounter: {},
    generic: {},
  };
  /**
    An instance of the OBJ parser used for loading mesh data.
   * @private

   * @type {ObjParser}
   */
  private static objPArser: ObjParser = new ObjParser();

  public static set(key: string, value: any): void {
    EngineCache.__cache.generic[key] = value;
  }

  public static get<T>(key: string): T {
    return EngineCache.__cache.generic[key] as T;
  }

  /**
    Retrieves a 2D texture from the cache or loads and caches it if not present.

   * @param {string} uri - The URI of the texture.
   * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
   * @returns {Texture} - The cached or newly loaded Texture instance.
   */
  public static async getTexture2D(
    uri: string,
    gl?: WebGL2RenderingContext
  ): Promise<Texture> {
    let result = EngineCache.__cache.textures[uri] as Texture;
    if (!result) {
      result = new Texture(gl, uri);
      EngineCache.__cache.textures[uri] = result;
      EngineCache.__cache.textureCounter[uri] = 1;
    } else {
      EngineCache.__cache.textureCounter[uri]++;
    }
    await result.load();
    return result;
  }

  /**
  Retrieves a Cube texture from the cache or loads and caches it if not present.

 * @param {string} uri - The URI of the texture.
 * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
 * @returns {Promise<CubemapTexture>} - A promise that resolves with the cached or newly loaded CubemapTexture instance.
 */
  public static async getTextureCube(
    uris: ICubemapSides,
    gl?: WebGL2RenderingContext
  ): Promise<CubemapTexture> {
    const { right, left, up, bottom, front, back } = uris;
    const key = [right, left, up, bottom, front, back].join("|");

    let result = EngineCache.__cache.textures[key] as CubemapTexture;
    if (!result) {
      result = new CubemapTexture(gl, [right, left, up, bottom, front, back]);
      EngineCache.__cache.textures[key] = result;
      EngineCache.__cache.textureCounter[key] = 1;
    } else {
      EngineCache.__cache.textureCounter[key]++;
    }
    await result.load();
    return result;
  }

  public static getWhiteTexture(gl: WebGL2RenderingContext): Texture {
    const key = "__white_texture__";
    let result = EngineCache.__cache.textures[key];
    if (!result) {
      result = Texture.create(gl, 1, 1, new Uint8Array([255, 255, 255, 255]));
      EngineCache.__cache.textures[key] = result;
      EngineCache.__cache.textureCounter[key] = 1;
    }
    return result as Texture;
  }

  public static getNormalTexture(gl: WebGL2RenderingContext): Texture {
    const key = "__normal_texture__";
    let result = EngineCache.__cache.textures[key];
    if (!result) {
      result = Texture.create(gl, 1, 1, new Uint8Array([128, 128, 255, 255]));
      EngineCache.__cache.textures[key] = result;
      EngineCache.__cache.textureCounter[key] = 1;
    }
    return result as Texture;
  }

  public static releaseTexture(texture: Texture): void {
    const uri = texture.textureUri!;
    if (EngineCache.__cache.textureCounter[uri]) {
      EngineCache.__cache.textureCounter[uri]--;
      if (EngineCache.__cache.textureCounter[uri] === 0) {
        texture.destroy();
        delete EngineCache.__cache.textures[uri];
        delete EngineCache.__cache.textureCounter[uri];
      }
    }
  }

  /**
    Retrieves mesh data parsed from an OBJ file from the cache or loads, parses, and caches it if not present.


   * @param {string} uri - The URI of the OBJ file.
   * @returns {Promise<MeshData>} - A promise that resolves with the mesh data.
   */
  public static async getMeshDataFromObj(uri: string): Promise<MeshData> {
    let result = EngineCache.__cache.meshs[uri];
    if (!result) {
      const obj = await fetch(uri);
      const text = await obj.text();
      result = EngineCache.objPArser.parse(text) as MeshData;
      EngineCache.__cache.meshs[uri] = result;
    }
    return result;
  }

  /**
    Retrieves shader source code from the cache or loads and caches it if not present.


   * @param {string} uri - The URI of the shader source file.
   * @returns {Promise<string>} - A promise that resolves with the shader source code as a string.
   */
  public static async loadShaderSource(uri: string): Promise<string> {
    let result = EngineCache.__cache.shaderCode[uri];
    if (!result) {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to load shader: ${uri}`);
      }
      result = await response.text();
      EngineCache.__cache.shaderCode[uri] = result;
    }
    return result;
  }

  /**
    Clears all cached data, including textures, meshes, and shader code.
   */
  public static clear(): void {
    // for (const key in EngineCache.__cache.textures) {
    //   const texture = EngineCache.__cache.textures[key];
    //   if (texture) {
    //     texture.destroy();
    //   }
    // }

    EngineCache.__cache = {
      shaderCode: {},
      textures: {},
      meshs: {},
      textureCounter: {},
      generic: {},
    };
  }
}
