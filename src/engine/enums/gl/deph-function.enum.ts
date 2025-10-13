export enum DephFunction {
    /**
     * The fragment passes if its depth value is less than the stored value.
     * This is the default and most common setting for 3D rendering.
     */
    Less = WebGL2RenderingContext.LESS,

    /**
     * The fragment passes if its depth value is less than or equal to the stored value.
     */
    LessOrEqual = WebGL2RenderingContext.LEQUAL,

    /**
     * The fragment passes if its depth value is greater than the stored value.
     * This is useful when rendering from back to front.
     */
    Greater = WebGL2RenderingContext.GREATER,

    /**
     * The fragment passes if its depth value is greater than or equal to the stored value.
     */
    GreaterOrEqual = WebGL2RenderingContext.GEQUAL,

    /**
     * The fragment passes if its depth value is equal to the stored value.
     */
    Equal = WebGL2RenderingContext.EQUAL,

    /**
     * The fragment always passes.
     */
    Always = WebGL2RenderingContext.ALWAYS,

    /**
     * The fragment never passes.
     */
    Never = WebGL2RenderingContext.NEVER,
}

