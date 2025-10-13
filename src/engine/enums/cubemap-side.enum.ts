/**
  An enumeration representing the faces of a cube map texture.
 * The values correspond to the order specified in WebGL for `gl.TEXTURE_CUBE_MAP_POSITIVE_X` and subsequent faces.
 */
export enum CubeMapSide {
  /**
    The positive X face of the cube map.
   */
  RIGHT = 0,
  /**
    The negative X face of the cube map.
   */
  LEFT = 1,
  /**
    The positive Y face of the cube map.
   */
  TOP = 2,
  /**
    The negative Y face of the cube map.
   */
  BOTTOM = 3,
  /**
    The positive Z face of the cube map.
   */
  FRONT = 4,
  /**
    The negative Z face of the cube map.
   */
  BACK = 5,
}