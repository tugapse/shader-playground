/**
  An enumeration representing the different primitive types used for rendering in WebGL.
 * The values are the corresponding WebGL constants, which define how vertices are interpreted and assembled into graphics primitives.
 */
export enum GLPrimitiveType {
  /**
    Renders a series of disconnected points. Each vertex is a point.
   */
  POINTS = 0x0000,
  /**
    Renders a series of disconnected line segments. Pairs of vertices define a separate line.
   */
  LINES = 0x0001,
  /**
    Renders a connected series of line segments. Each successive vertex is connected to the previous one.
   */
  LINE_STRIP = 0x0002,
  /**
    Renders a connected series of line segments, with the last vertex connected to the first, forming a loop.
   */
  LINE_LOOP = 0x0003,
  /**
    Renders a series of disconnected triangles. Every three vertices define a new triangle.
   */
  TRIANGLES = 0x0004,
  /**
    Renders a connected group of triangles. Each new vertex adds a new triangle, connecting to the two previous vertices.
   */
  TRIANGLE_STRIP = 0x0005,
  /**
    Renders a connected group of triangles that all share a common first vertex.
   */
  TRIANGLE_FAN = 0x0006,
}