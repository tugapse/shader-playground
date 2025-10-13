export interface IRendererBehaviour {
    _gl: WebGL2RenderingContext;
    setGl(gl: WebGL2RenderingContext): void;
}