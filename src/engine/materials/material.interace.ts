import { Shader } from "../shaders/shader";

/**
  An interface representing a material that can load its properties as uniforms into a shader program.
 */
export interface IMaterial {
  /**
    Loads the material's properties (such as color, textures, etc.) into the specified shader as uniform variables.
   * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
   * @param {Shader} shader - The shader program to load the uniforms into.
   * @returns {void}
   */
  loadUniforms(gl: WebGL2RenderingContext, shader: Shader): void;
}