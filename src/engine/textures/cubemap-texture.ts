import { JsonSerializedData } from "../interfaces";
import { Texture } from "./texture";

/**
  A class for managing the loading, creation, and binding of a cubemap texture for use in WebGL.
 * It handles six individual images (one for each face of the cube) and combines them into a single cubemap texture object.
 * @augments {Texture}
 */
export class CubemapTexture extends Texture {

  protected override _className = "CubemapTexture";

  /**
   * Flag indicating if this texture is a procedurally generated white fallback cubemap.
   * @type {boolean}
   */
  public isWhiteCubemap: boolean = false;

  /**
    An array to hold the HTML image elements for each of the six faces.
   * @protected
   * @type {HTMLImageElement[]}
   */
  protected imagesData: HTMLImageElement[] = [];
  /**
    An array to track the loading status of each individual face image.
   * @private
   * @type {(boolean | null)[]}
   */
  private loadedImages: (boolean | null)[] = [null, null, null, null, null, null];

  /**
    Creates an instance of CubeMapTexture.
   * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
   * @param {string[]} [textureUris] - An array of six URIs for the cube map faces in the order: right, left, top, bottom, front, back.
   */
  constructor(protected override gl?: WebGL2RenderingContext, public textureUris?: string[]) {
    super(gl);
  }

  /**
   * Creates a 1x1 cubemap texture filled with white pixels for each face.
   * This is useful as a default or fallback cubemap.
   * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
   * @returns {CubemapTexture} A new CubemapTexture instance containing the white pixels.
   */
  public static createWhiteCubemap(gl: WebGL2RenderingContext): CubemapTexture {
    const result = new CubemapTexture(gl);
    result.isWhiteCubemap = true;
    result.generateWhiteCubemap(gl);
    result.isLoaded = true;
    return result;
  }

  /**
   * Generates a 1x1 white pixel for each face and assigns the GL texture.
   * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
   */
  private generateWhiteCubemap(gl: WebGL2RenderingContext): void {
    this._glTexture = gl.createTexture();
    if (!this._glTexture) {
      console.error("Failed to create WebGL texture for white cubemap.");
      return;
    }

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this._glTexture);

    const whitePixel = new Uint8Array([255, 255, 255, 255]);
    const targets = [
      gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
    ];

    for (const target of targets) {
      gl.texImage2D(target, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, whitePixel);
    }

    this.minFilter = gl.NEAREST;
    this.magFilter = gl.NEAREST;
    this.wrapS = gl.CLAMP_TO_EDGE;
    this.wrapT = gl.CLAMP_TO_EDGE;

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, this.minFilter);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, this.magFilter);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, this.wrapS);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, this.wrapT);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, this.wrapT);

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

    this._width = 1;
    this._height = 1;
  }

  /**
    Loads all six images from their respective URLs.
   * @override
   * @returns {Promise<void>} - A Promise that resolves when all images are loaded.
   */
  public override async load(): Promise<void> {
    if (this.isLoading || this.isImageLoaded) return;
    this.isLoading = true;
    return new Promise((resolve, reject) => {
      // Check if this is a procedurally generated fallback
      if (this.isWhiteCubemap) {
        if (this.gl) {
          this.generateWhiteCubemap(this.gl);
          this.isLoaded = true;
          this.isLoading = false;
          resolve();
        } else {
          reject(new Error("GL context missing for white cubemap."));
        }
        return;
      }

      if (!this.textureUris || this.textureUris.length !== 6) {
        reject(new Error("Cubemap requires exactly six texture URIs."));
        return;
      }
      for (let i = 0; i < this.textureUris.length; i++) {
        this.loadedImages[i] = null;
        const _image = new Image();
        _image.onload = () => {
          this.setLoadedImage(i, true);
          if (this.allImagesFetchedAndLoaded()) {
            resolve();
          }
        };
        _image.onerror = (error) => {
          this.setLoadedImage(i, false);
          reject(new Error(`Failed to load image: ${this.textureUris![i]}. Error: ${error}`));
        };
        _image.src = this.textureUris![i];
        this.imagesData[i] = _image;
      }
    });
  }

  /**
    Checks if all images have been successfully fetched and loaded.
   * @protected
   * @returns {boolean} - True if all images are loaded, otherwise false.
   */
  protected allImagesFetchedAndLoaded(): boolean {
    return this.loadedImages.filter(e => e === true).length === this.textureUris?.length;
  }

  /**
    Checks if all image fetch operations have completed, regardless of success.
   * @protected
   * @returns {boolean} - True if all fetch attempts are done, otherwise false.
   */
  protected allImagesFetched(): boolean {
    return this.loadedImages.filter(e => e == null).length === 0;
  }

  /**
    Updates the loading status of a single image and triggers the creation of the WebGL texture if all images are loaded.
   * @param {number} imageIndex - The index of the image that has finished loading.
   * @param {boolean} wasLoaded - A boolean indicating if the image loaded successfully.
   * @returns {void}
   */
  public setLoadedImage(imageIndex: number, wasLoaded: boolean): void {
    this.loadedImages[imageIndex] = wasLoaded;
    if (this.allImagesFetchedAndLoaded() && !this.isImageLoaded && this.gl) {
      this.createGLTexture(this.gl);
      this.isLoaded = true;
      this.isLoading = false;
    } else if (this.allImagesFetched() && !this.allImagesFetchedAndLoaded()) {
      console.error("Was not possible to get all images!");
    }
  }

  /**
    Binds the cubemap texture to the `TEXTURE_CUBE_MAP` target.
   * @override
   * @returns {void}
   */
  override bind(): void {
    if (!this.gl) return;

    this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this._glTexture);
  }

  /**
    Creates the WebGLTexture object from the six loaded images.
   * @protected
   * @override
   * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
   * @returns {void}
   */
  protected override createGLTexture(gl: WebGL2RenderingContext): void {
    this._glTexture = gl.createTexture();
    if (!this._glTexture) {
      console.error("Failed to create WebGL texture for cubemap.");
      return;
    }

    this.bind();

    // Use the filter properties loaded from JSON or defaults
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, this.minFilter);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, this.magFilter);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, this.wrapS);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, this.wrapT);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, this.wrapT);

    const faces = [
      { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, image: this.imagesData[0] },
      { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, image: this.imagesData[1] },
      { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, image: this.imagesData[2] },
      { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, image: this.imagesData[3] },
      { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, image: this.imagesData[4] },
      { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, image: this.imagesData[5] },
    ];

    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;

    faces.forEach((faceInfo) => {
      gl.texImage2D(faceInfo.target, level, internalFormat, srcFormat, srcType, faceInfo.image);
    });
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    this.unBind();
  }

  /**
    Sets the URIs for the six faces of the cubemap texture.
   * @param {string[]} uris - An array of six URIs.
   * @returns {void}
   */
  public setTextureUris(uris: string[]): void {
    if (uris?.length !== 6) {
      console.error(`Incorrect number of uris: 6 were expected but ${uris.length} were given!`);
    }
    this.textureUris = uris;
  }

  override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      uris: this.textureUris,
      isWhiteCubemap: this.isWhiteCubemap
    }
  }

  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.textureUris = jsonObject["uris"];
    this.isWhiteCubemap = jsonObject["isWhiteCubemap"] ?? false;

    // Reset load states so the texture is re-fetched and the WebGL resource is recreated
    this.isLoaded = false;
    this.isLoading = false;
    this.loadedImages = [null, null, null, null, null, null];
    this.imagesData = [];
  }
}
