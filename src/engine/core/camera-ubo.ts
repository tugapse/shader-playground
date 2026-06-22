import { mat4 } from "gl-matrix";

export class CameraUBO {
  private gl: WebGL2RenderingContext;
  private ubo: WebGLBuffer;
  private data: Float32Array;
  
  // This is the global binding point. All shaders will look here for camera data.
  public readonly BINDING_POINT = 0; 

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.ubo = gl.createBuffer()!;
    
    // We need space for two mat4s. 
    // 1 mat4 = 16 floats. 2 mat4s = 32 floats.
    this.data = new Float32Array(32); 

    this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.ubo);
    // DYNAMIC_DRAW because the camera updates every frame
    this.gl.bufferData(this.gl.UNIFORM_BUFFER, this.data.byteLength, this.gl.DYNAMIC_DRAW); 
    
    // Bind this buffer to the global binding point 0
    this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, this.BINDING_POINT, this.ubo);
    this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);
  }

  /**
   * Call this EXACTLY ONCE per frame in your main render loop.
   */
  public update(viewMatrix: mat4, projectionMatrix: mat4): void {
    // Pack the two matrices into our single Float32Array
    this.data.set(viewMatrix, 0);          // Offset 0
    this.data.set(projectionMatrix, 16);   // Offset 16

    this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.ubo);
    // Push the updated array to the GPU
    this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, 0, this.data);
    this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null);
  }
}