import { Texture } from "../textures/texture";



export class CubeMapTexture extends Texture {


  protected _images: HTMLImageElement[] | null = null;
  protected override _glTexture: WebGLTexture[] | null = null;

  constructor(protected override gl:WebGL2RenderingContext, textureUris:string ){
    super(gl);
  }

}
