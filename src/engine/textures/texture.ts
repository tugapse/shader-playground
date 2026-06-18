// The WebGL constants are retrieved from the WebGL2RenderingContext
// for more robust and type-safe enums.
import { EngineCache } from "@engine/core";
import { JsonSerializable, JsonSerializedData } from "../interfaces";

/**
 * An enumeration of WebGL texture targets.
 */
export enum TextureTarget {
  TEXTURE_2D = WebGL2RenderingContext.TEXTURE_2D,
}

/**
 * An enumeration of texture filtering modes. These values correspond to WebGL constants for minification and magnification filters.
 */
export enum TextureFilterMode {
  NEAREST = WebGL2RenderingContext.NEAREST,
  LINEAR = WebGL2RenderingContext.LINEAR,
  NEAREST_MIPMAP_NEAREST = WebGL2RenderingContext.NEAREST_MIPMAP_NEAREST,
  LINEAR_MIPMAP_NEAREST = WebGL2RenderingContext.LINEAR_MIPMAP_NEAREST,
  NEAREST_MIPMAP_LINEAR = WebGL2RenderingContext.NEAREST_MIPMAP_LINEAR,
  LINEAR_MIPMAP_LINEAR = WebGL2RenderingContext.LINEAR_MIPMAP_LINEAR,
}

/**
 * An enumeration of texture wrapping modes. These values correspond to WebGL constants for `TEXTURE_WRAP_S` and `TEXTURE_WRAP_T`.
 */
export enum TextureWrapMode {
  REPEAT = WebGL2RenderingContext.REPEAT,
  MIRRORED_REPEAT = WebGL2RenderingContext.MIRRORED_REPEAT,
  CLAMP_TO_EDGE = WebGL2RenderingContext.CLAMP_TO_EDGE,
}

/**
 * An enumeration of WebGL texture parameters.
 */
export enum TextureParameter {
  MIN_FILTER = WebGL2RenderingContext.TEXTURE_MIN_FILTER,
  MAG_FILTER = WebGL2RenderingContext.TEXTURE_MAG_FILTER,
  WRAP_S = WebGL2RenderingContext.TEXTURE_WRAP_S,
  WRAP_T = WebGL2RenderingContext.TEXTURE_WRAP_T,
}

/**
 * A class to manage the loading, creation, and binding of 2D textures for use in WebGL.
 * @extends {JsonSerializable}
 */
export class Texture extends JsonSerializable {
  /**
   * The HTML image element that contains the texture data.
   * @protected
   * @type {HTMLImageElement | null}
   */
  protected image: HTMLImageElement | null = null;
  /**
   * The WebGL texture object.
   * @protected
   * @type {WebGLTexture | null}
   */
  protected _glTexture: WebGLTexture | null = null;
  /**
   * Indicates whether the image data has been loaded.
   * @protected
   * @type {boolean}
   */
  public isLoaded: boolean = false;
  /**
   * Indicates whether the texture is currently in the process of loading.
   * @protected
   * @type {boolean}
   */
  public isLoading: boolean = false;
  /**
   * The minification filter.
   * @public
   * @type {TextureFilterMode}
   */
  public minFilter: TextureFilterMode = TextureFilterMode.LINEAR_MIPMAP_LINEAR;
  /**
   * The magnification filter.
   * @public
   * @type {TextureFilterMode}
   */
  public magFilter: TextureFilterMode = TextureFilterMode.LINEAR;
  /**
   * The texture wrap mode for the S (horizontal) axis.
   * @public
   * @type {TextureWrapMode}
   */
  public wrapS: TextureWrapMode = TextureWrapMode.MIRRORED_REPEAT;
  /**
   * The texture wrap mode for the T (vertical) axis.
   * @public
   * @type {TextureWrapMode}
   */
  public wrapT: TextureWrapMode = TextureWrapMode.MIRRORED_REPEAT;
  /**
   * A flag to indicate if the texture is currently in a bound state.
   * @protected
   * @type {boolean}
   */
  protected _isBound: boolean = false;
  /**
   * The width of the texture in pixels.
   * @protected
   * @type {number}
   */
  protected _width: number = 0;

  /**
   * The height of the texture in pixels.
   * @protected
   * @type {number}
   */
  protected _height: number = 0;

  /**
   * A promise that resolves when the texture is fully loaded.
   * @protected
   * @type {Promise<void> | null}
   */
  protected _loadPromise: Promise<void> | null = null;

  /**
   * Creates an instance of Texture.
   * @param {WebGL2RenderingContext} [gl] - The WebGL2 rendering context.
   * @param {string} [textureUri] - The URI of the image to load.
   */
  constructor(protected gl?: WebGL2RenderingContext, public textureUri?: string) {
    super("Texture");
  }

  /**
   * Sets the WebGL2 rendering context for the texture.
   * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
   * @returns {void}
   */
  public setGL(gl: WebGL2RenderingContext): void {
    this.gl = gl;
  }
    /**
   * Creates a new texture specifically for depth information (e.g., for shadow mapping).
   * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
   * @param {number} width - The width of the texture.
   * @param {number} height - The height of the texture.
   * @returns {Texture} A new Texture instance configured as a depth texture.
   */
  public static createDepthTexture(gl: WebGL2RenderingContext, width: number, height: number): Texture {
    const texture = gl.createTexture();
    if (!texture) {
      console.error("Failed to create WebGL depth texture.");
      return new Texture(gl);
    }
    gl.bindTexture(TextureTarget.TEXTURE_2D, texture);

    // Use a depth-specific internal format
    gl.texImage2D(
      TextureTarget.TEXTURE_2D,
      0,
      gl.DEPTH_COMPONENT32F, // Internal format for depth (e.g., 32-bit float)
      width,
      height,
      0,
      gl.DEPTH_COMPONENT, // Format of the data you're providing
      gl.FLOAT,           // Type of the data
      null // No initial data
    );

    // Set filtering and wrapping modes suitable for a depth map
    gl.texParameteri(TextureTarget.TEXTURE_2D, TextureParameter.MIN_FILTER, TextureFilterMode.NEAREST);
    gl.texParameteri(TextureTarget.TEXTURE_2D, TextureParameter.MAG_FILTER, TextureFilterMode.NEAREST);
    gl.texParameteri(TextureTarget.TEXTURE_2D, TextureParameter.WRAP_S, TextureWrapMode.CLAMP_TO_EDGE);
    gl.texParameteri(TextureTarget.TEXTURE_2D, TextureParameter.WRAP_T, TextureWrapMode.CLAMP_TO_EDGE);

    gl.bindTexture(TextureTarget.TEXTURE_2D, null);

    const result = new Texture(gl);
    result._glTexture = texture;
    result.isLoaded = true;
    result._width = width;
    result._height = height;
    return result;
  }

  /**
   * Creates and returns a texture with a specified color and size.
   * This is useful for creating fallback textures or solid colors.
   * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
   * @param {number} width - The width of the texture.
   * @param {number} height - The height of the texture.
   * @param {Uint8Array} [color] - An optional array of color data. If not provided, a single white pixel is used.
   * @returns {Texture} A new Texture instance.
   */
  public static create(gl: WebGL2RenderingContext, width: number, height: number, color: Uint8Array | null = null): Texture {
    const texture = gl.createTexture();
    if (!texture) {
        console.error("Failed to create WebGL texture.");
        return new Texture(gl);
    }
    gl.bindTexture(TextureTarget.TEXTURE_2D, texture);

    if (color === null) {
      gl.texImage2D(TextureTarget.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

      gl.texParameteri(TextureTarget.TEXTURE_2D, TextureParameter.MIN_FILTER, TextureFilterMode.NEAREST);
      gl.texParameteri(TextureTarget.TEXTURE_2D, TextureParameter.MAG_FILTER, TextureFilterMode.NEAREST);
    } else {
      gl.texImage2D(TextureTarget.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, color);

      gl.texParameteri(TextureTarget.TEXTURE_2D, TextureParameter.MIN_FILTER, TextureFilterMode.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(TextureTarget.TEXTURE_2D, TextureParameter.MAG_FILTER, TextureFilterMode.LINEAR);
    }
    gl.generateMipmap(TextureTarget.TEXTURE_2D);

    gl.texParameteri(TextureTarget.TEXTURE_2D, TextureParameter.WRAP_S, TextureWrapMode.CLAMP_TO_EDGE);
    gl.texParameteri(TextureTarget.TEXTURE_2D, TextureParameter.WRAP_T, TextureWrapMode.CLAMP_TO_EDGE);

    gl.bindTexture(TextureTarget.TEXTURE_2D, null);

    const result = new Texture(gl);
    result._glTexture = texture;
    result.isLoaded = true;
    result._width = width;
    result._height = height;
    return result;
  }

  /**
   * Loads an image from the provided URI and creates the WebGL texture.
   * @returns {Promise<void>} A Promise that resolves when the image is fully loaded and the WebGL texture is created.
   */
  public load(): Promise<void> {
    if (this._loadPromise) {
      return this._loadPromise;
    }

    if (this.isLoaded) {
      return Promise.resolve();
    }

    if (!this.gl) {
      return Promise.reject(new Error("WebGL context not available."));
    }

    this._loadPromise = new Promise((resolve, reject) => {
      if (!this.textureUri) {
        return reject(new Error("Failed to load image. Please provide a texture URL!"));
      }

      this.isLoading = true;
      this.image = new Image();
      this.image.onload = () => {
        if (!this.image || !this.gl) {
          this.isLoading = false;
          return reject(new Error("Image or WebGL context is null after loading."));
        }
        this.isLoaded = true;
        this.isLoading = false;
        this._width = this.image.width;
        this._height = this.image.height;
        this.createGLTexture(this.gl);
        resolve();
      };
      this.image.onerror = (error) => {
        this.isLoading = false;
        this.isLoaded = false;
        this.image = null;
        this._loadPromise = null; // Allow retrying
        reject(new Error(`Failed to load image: ${this.textureUri!}. Error: ${error}`));
      };
      this.image.src = this.textureUri;
    });

    return this._loadPromise;
  }

  /**
   * Creates the WebGLTexture object from the loaded image data.
   * @protected
   * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
   * @returns {void}
   */
  protected createGLTexture(gl: WebGL2RenderingContext): void {
    if (!this.isLoaded || !this.image) {
      console.warn("Image not loaded or image data is missing. Cannot create WebGL texture.");
      return;
    }

    this._glTexture = gl.createTexture();
    this.bind();
    gl.texImage2D(TextureTarget.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
    this.setTextureParameters();
    this.unBind();
  }

  /**
   * Re-uploads the texture data to the GPU. This is useful if the underlying image or data has changed.
   * @returns {void}
   */
  public rebuild(): void {
    if (!this.gl || !this.isLoaded || !this.image) {
      console.warn("Cannot rebuild texture. Either WebGL context, image, or loading status is invalid.");
      return;
    }
    this.bind();
    this.gl.texImage2D(
      TextureTarget.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      this.image
    );
    this.setTextureParameters();
    this.unBind();
  }

  /**
   * Sets the texture filtering and wrapping parameters for the texture.
   * This method applies the values stored in the class properties to the GPU.
   * @returns {void}
   */
  public setTextureParameters(): void {
    if (!this.gl) return;
    this.bind();
    this.gl.texParameteri(TextureTarget.TEXTURE_2D, TextureParameter.MIN_FILTER, this.minFilter);
    this.gl.texParameteri(TextureTarget.TEXTURE_2D, TextureParameter.MAG_FILTER, this.magFilter);
    this.gl.texParameteri(TextureTarget.TEXTURE_2D, TextureParameter.WRAP_S, this.wrapS);
    this.gl.texParameteri(TextureTarget.TEXTURE_2D, TextureParameter.WRAP_T, this.wrapT);
    this.gl.generateMipmap(TextureTarget.TEXTURE_2D);
    this.unBind();
  }

  /**
   * Sets the minification filter for the texture.
   * @param {TextureFilterMode} filter - The minification filter to apply.
   * @returns {void}
   */
  public setMinFilter(filter: TextureFilterMode): void {
    this.minFilter = filter;
    this.setTextureParameters();
  }

  /**
   * Sets the magnification filter for the texture.
   * @param {TextureFilterMode} filter - The magnification filter to apply.
   * @returns {void}
   */
  public setMagFilter(filter: TextureFilterMode): void {
    this.magFilter = filter;
    this.setTextureParameters();
  }

  /**
   * Sets the texture wrapping mode for the S axis.
   * @param {TextureWrapMode} wrap - The wrapping mode to apply.
   * @returns {void}
   */
  public setWrapS(wrap: TextureWrapMode): void {
    this.wrapS = wrap;
    this.setTextureParameters();
  }

  /**
   * Sets the texture wrapping mode for the T axis.
   * @param {TextureWrapMode} wrap - The wrapping mode to apply.
   * @returns {void}
   */
  public setWrapT(wrap: TextureWrapMode): void {
    this.wrapT = wrap;
    this.setTextureParameters();
  }

  /**
   * Sets a sub-region of the texture's pixels.
   * @param {number} x - The x-coordinate of the sub-region to update.
   * @param {number} y - The y-coordinate of the sub-region to update.
   * @param {number} width - The width of the sub-region.
   * @param {number} height - The height of the sub-region.
   * @param {TexImageSource | ArrayBufferView} data - The pixel data to upload.
   * @returns {void}
   */
  public setPixels(
    x: number,
    y: number,
    width: number,
    height: number,
    data: TexImageSource | ArrayBufferView
  ): void {
    if (!this.gl || !this._glTexture) {
      console.warn("Cannot set pixels. WebGL context or texture is not available.");
      return;
    }
    this.bind();

    // Differentiate between data types to call the correct overload
    if (data instanceof HTMLImageElement || data instanceof HTMLCanvasElement || data instanceof HTMLVideoElement) {
      // This handles TexImageSource types
      this.gl.texSubImage2D(
        this.gl.TEXTURE_2D,
        0,
        x,
        y,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        data
      );
    } else {
      // This handles ArrayBufferView types
      this.gl.texSubImage2D(
        this.gl.TEXTURE_2D,
        0,
        x,
        y,
        width,
        height,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        data as ArrayBufferView
      );
    }

    this.unBind();
  }
  /**
   * Reads the pixels from the texture and returns them as a Uint8Array.
   * NOTE: This function requires the texture to be attached to a framebuffer object (FBO).
   * A more complete implementation would handle FBO creation and binding.
   * @param {number} width - The width of the texture to read.
   * @param {number} height - The height of the texture to read.
   * @returns {Uint8Array | null} A Uint8Array containing the pixel data, or null if an error occurred.
   */
  public getPixels(width: number, height: number): Uint8Array | null {
    if (!this.gl || !this._glTexture) {
      console.warn("Cannot get pixels. WebGL context or texture is not available.");
      return null;
    }

    // A temporary FBO is needed to read pixels from the texture
    const fbo = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      TextureTarget.TEXTURE_2D,
      this._glTexture,
      0
    );

    // Allocate an array to hold the pixel data
    const pixels = new Uint8Array(width * height * 4); // 4 components: R, G, B, A

    // Read the pixels from the framebuffer
    this.gl.readPixels(
      0, 0,
      width, height,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      pixels
    );

    // Clean up the FBO
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.deleteFramebuffer(fbo);

    return pixels;
  }

  /**
   * Binds the texture to the `TEXTURE_2D` target if it is not already bound.
   * @returns {void}
   */
  public bind(): void {
    if (!this.gl) {
      return;
    }
    this.gl.bindTexture(TextureTarget.TEXTURE_2D, this._glTexture);
    this._isBound = true;
  }

  /**
   * Unbinds the texture from the `TEXTURE_2D` target if it is currently bound.
   * @returns {void}
   */
  public unBind(): void {
    if (!this.gl || !this._isBound) {
      return;
    }
    this.gl.bindTexture(TextureTarget.TEXTURE_2D, null);
    this._isBound = false;
  }

  /**
   * Gets the WebGLTexture object.
   * @readonly
   * @type {WebGLTexture | null}
   */
  public get glTexture(): WebGLTexture | null {
    return this._glTexture;
  }

  /**
   * Checks if the image data has been successfully loaded into the HTMLImageElement.
   * @readonly
   * @type {boolean}
   */
  public get isImageLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Gets the width of the texture.
   * @readonly
   * @type {number}
   */
  public get width(): number {
    return this._width;
  }

  /**
   * Gets the height of the texture.
   * @readonly
   * @type {number}
   */
  public get height(): number {
    return this._height;
  }

  /**
   * Destroys the WebGL texture to free up GPU memory.
   * @returns {void}
   */
  public destroy(): void {
    if (this.gl && this._glTexture) {
      EngineCache.releaseTexture(this);
      this.gl.deleteTexture(this._glTexture);
      this._glTexture = null;
    }
    this.image = null;
    this.isLoaded = false;
  }

  /**
   * Converts the texture object to a JSON serializable format.
   * @override
   * @returns {JsonSerializedData}
   */
  public override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      url: this.textureUri,
      minFilter: this.minFilter,
      magFilter: this.magFilter,
      wrapS: this.wrapS,
      wrapT: this.wrapT,
    };
  }

  /**
   * Populates the texture object from a JSON serializable object.
   * @override
   * @param {JsonSerializedData} jsonObject
   * @returns {void}
   */
  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.textureUri = jsonObject["url"];
    if (jsonObject["minFilter"]) {
      this.minFilter = jsonObject["minFilter"] as TextureFilterMode;
    }
    if (jsonObject["magFilter"]) {
      this.magFilter = jsonObject["magFilter"] as TextureFilterMode;
    }
    if (jsonObject["wrapS"]) {
      this.wrapS = jsonObject["wrapS"] as TextureWrapMode;
    }
    if (jsonObject["wrapT"]) {
      this.wrapT = jsonObject["wrapT"] as TextureWrapMode;
    }

    if (this.isImageLoaded) {
      this.setTextureParameters();
    }
  }
}
