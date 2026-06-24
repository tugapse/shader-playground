import { Scene } from '@engine/entities';

export interface IRenderPass {
  name:string;
  initialize(gl: WebGL2RenderingContext): void;
  execute( scene: Scene): void;
  cleanup(): void;
  resize(width: number, height: number): void;
  setGl(gl:WebGL2RenderingContext):void;
}