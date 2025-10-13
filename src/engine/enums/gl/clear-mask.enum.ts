export enum ClearMask {
    /**
     * Clears the color buffer (the pixels you see on screen).
     */
    Color = WebGL2RenderingContext.COLOR_BUFFER_BIT,

    /**
     * Clears the depth buffer. This is essential for correct 3D rendering.
     */
    Depth = WebGL2RenderingContext.DEPTH_BUFFER_BIT,

    /**
     * Clears the stencil buffer.
     */
    Stencil = WebGL2RenderingContext.STENCIL_BUFFER_BIT,

    /**
     * Clears both the color and depth buffers. This is the most common combination for 3D scenes.
     */
    ColorAndDepth = WebGL2RenderingContext.COLOR_BUFFER_BIT | WebGL2RenderingContext.DEPTH_BUFFER_BIT,
}