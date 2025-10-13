/**
 * A static class to store and provide access to the current dimensions of the rendering canvas or viewport.
 * This class is used throughout the engine to get the current width and height of the rendering surface.
 */
export class CanvasViewport {
  /**
   * The width of the renderer viewport.
   * This value is updated whenever the canvas is resized.
   * @type {number}
   */
  public static rendererWidth = 0;
  /**
   * The height of the renderer viewport.
   * This value is updated whenever the canvas is resized.
   * @type {number}
   */
  public static rendererHeight = 0;
}