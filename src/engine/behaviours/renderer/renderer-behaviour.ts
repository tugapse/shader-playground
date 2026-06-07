import { mat3, mat4, vec3 } from "gl-matrix";
import { Transform, Vector3 } from "../../core";
import { CanvasViewport } from "../../core/canvas-viewport";
import { Mesh } from "../../core/mesh";
import { ObjectInstanciator } from "../../core/object-instanciator";
import { Camera } from "../../entities/camera";
import { FaceWinding, RenderLayer } from "../../enums";
import { GLPrimitiveType } from "../../enums/gl-primitive-type.enum";
import { BlendingDestinationFactor, BlendingSourceFactor } from "../../enums/gl/blend.enum";
import { CullFace } from "../../enums/gl/cull-face.enum";
import { DephFunction } from "../../enums/gl/deph-function.enum";
import { ShaderUniformsEnum } from "../../enums/shader-uniforms.enum";
import { BlendingMode } from "../../interfaces/blend-mode";
import { JsonSerializedData } from "../../interfaces/json-serialized-data.interface";
import { IRendererBehaviour } from "../../interfaces/renderer-behaviour.interface";
import { ColorMaterial as Material } from "../../materials";
import { Shader } from "../../shaders/shader";
import { EntityBehaviour } from "../entity-behaviour";

/**
 * The base class for all renderer behaviours, responsible for drawing meshes to the canvas.
 * This class handles the core rendering logic, including setting up WebGL states, managing shaders, and drawing meshes.
 * @augments {EntityBehaviour}
 * @implements {IRendererBehaviour}
 */
export class RendererBehaviour extends EntityBehaviour implements IRendererBehaviour {

  /**
   * The WebGL framebuffer object used for off-screen rendering.
   * @protected
   * @type {WebGLFramebuffer | null}
   */
  protected _framebuffer: WebGLFramebuffer | null = null;
  /**
   * The WebGL renderbuffer object for depth testing in off-screen rendering.
   * @protected
   * @type {WebGLRenderbuffer | null}
   */
  protected _depthRenderbuffer: WebGLRenderbuffer | null = null;

  /**
   * A static factory method to create an instance of the `RendererBehaviour`.
   * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
   * @returns {RendererBehaviour} A new instance of `RendererBehaviour`.
   */
  static override instanciate(gl: WebGL2RenderingContext) {
    return new RendererBehaviour(gl);
  }

  protected override _className = "RendererBehaviour"

  /**
   * The WebGL primitive type used for drawing the mesh.
   * @type {GLPrimitiveType}
   */
  public drawPrimitiveType: GLPrimitiveType = GLPrimitiveType.LINES;
  /**
   * The mesh data to be rendered.
   * @type {Mesh}
   */
  public mesh!: Mesh;
  /**
   * The shader program used for rendering.
   * @type {Shader | undefined}
   */
  public shader?: Shader;
  /**
   * The elapsed time since the renderer was initialized.
   * @protected
   * @type {number}
   */
  protected _time = 0;

  /**
   * The uniform location for the world matrix.
   * @protected
   * @type {WebGLUniformLocation | null}
   */
  protected _worldMatrixUniformLocation: WebGLUniformLocation | null = null;
  /**
   * The uniform location for the world inverse transpose matrix.
   * @protected
   * @type {WebGLUniformLocation | null}
   */
  protected _worldInverseTransposeMatrixUniformLocation: WebGLUniformLocation | null = null;

  /**
   * Determines if face culling is enabled.
   * @type {boolean}
   */
  public enableCullFace = true;
  /**
   * Determines if depth testing is enabled.
   * @type {boolean}
   */
  public enableDephTest = true;
  /**
   * Determines if blending is enabled.
   * @type {boolean}
   */
  public enableBlend = true;
  /**
   * Determines if writing to the depth buffer is enabled.
   * @type {boolean}
   */
  public writeToDephBuffer = true;

  /**
   * The face culling mode.
   * @type {CullFace}
   */
  public cullFace: CullFace = CullFace.BACK;
  /**
   * The depth testing mode.
   * @type {DephFunction}
   */
  public dephMode: DephFunction = DephFunction.Less;
  /**
   * The face winding order.
   * @type {FaceWinding}
   */
  public faceWinding: FaceWinding = FaceWinding.CounterClockwise;
  /**
   * The blending mode.
   * @type {BlendingMode}
   */
  public blendMode: BlendingMode = {
    sourcefactor: BlendingSourceFactor.SRC_ALPHA,
    destfactor: BlendingDestinationFactor.ONE_MINUS_SRC_ALPHA
  };
  /**
   * The render layer.
   * @type {RenderLayer}
   */
  public override renderLayer: RenderLayer = RenderLayer.OPAQUE;

  public castShadows = true;
 
  /**
   * Creates an instance of RendererBehaviour.
   * @param {WebGL2RenderingContext} _gl - The WebGL2 rendering context.
   */
  constructor(public _gl: WebGL2RenderingContext) {
    super();
    this.mesh = new Mesh();
  }

  /**
   * Initializes the renderer, including its WebGL settings and shader.
   * @override
   * @returns {boolean} True if initialization is successful, otherwise false.
   */
  override initialize(): boolean {
    if (this._initialized || !this._gl) return false;
    this.setGlSettings();
    this.initializeShader();
    return super.initialize();
  }

  /**
   * Sets the default WebGL state for rendering.
   * @protected
   * @returns {void}
   */
  protected setGlSettings(): void {
    if (!this._gl) return;

    if (this.enableDephTest) {
      this._gl.enable(this._gl.DEPTH_TEST);
      this._gl.depthFunc(this.dephMode);
    }
    else this._gl.disable(this._gl.DEPTH_TEST);

    if (this.enableBlend) {
      this._gl.enable(this._gl.BLEND);
      this._gl.blendFunc(this.blendMode.sourcefactor, this.blendMode.destfactor);
    } else this._gl.disable(this._gl.BLEND);

    if (this.enableCullFace) {
      this._gl.enable(this._gl.CULL_FACE);
      this._gl.cullFace(this.cullFace);
    } else this._gl.disable(this._gl.CULL_FACE);

    this._gl.depthMask(this.writeToDephBuffer);
    this._gl.frontFace(this.faceWinding);
  }

  /**
   * Initializes the shader and creates the necessary WebGL buffers.
   * @protected
   * @returns {void}
   */
  protected initializeShader(): void {
    if (!this.shader) return;
    this.shader.initialize();
    this.shader.buffers.position = this._gl.createBuffer();
    this.shader.buffers.uv = this._gl.createBuffer();
    this.shader.buffers.indices = this._gl.createBuffer();
  }

  /**
   * Sets the camera matrices (projection, view, and model-view-projection) in the shader.
   * @protected
   * @returns {void}
   */
  protected setCameraMatrices(): void {
    if (this.shader) {
      const camera = Camera.mainCamera;
      const mvpMatrix = mat4.create();
      this.parent.transform.updateMatrices();
      mat4.multiply(mvpMatrix, camera.projectionMatrix, camera.viewMatrix);
      mat4.multiply(mvpMatrix, mvpMatrix, this.parent.transform.modelMatrix);
      this.shader.setMat4(ShaderUniformsEnum.U_MVP_MATRIX, mvpMatrix);
    }
  }

  /**
   * Sets the world and world inverse transpose matrices in the shader for lighting calculations.
   * @protected
   * @returns {void}
   */
  protected setModelWorldMatrices(): void {
    if (this._worldMatrixUniformLocation) {
      this._gl.uniformMatrix4fv(this._worldMatrixUniformLocation, false, new Float32Array(this.parent.transform.modelMatrix));
    }
    if (this._worldInverseTransposeMatrixUniformLocation) {
      const worldInverseTransposeMatrix = mat4.create();
      mat4.invert(worldInverseTransposeMatrix, this.parent.transform.modelMatrix);
      mat4.transpose(worldInverseTransposeMatrix, worldInverseTransposeMatrix);

      const normalMatrixAsMat3 = mat3.create();
      mat3.fromMat4(normalMatrixAsMat3, worldInverseTransposeMatrix);

      this._gl.uniformMatrix3fv(this._worldInverseTransposeMatrixUniformLocation, false, new Float32Array(normalMatrixAsMat3));
    }
  }

  /**
   * Sets all common shader uniforms, including matrices, time, and screen resolution.
   * @protected
   * @returns {void}
   */
  protected setShaderVariables(): void {
    this.setGlSettings();
    this.setCameraMatrices();
    this.setModelWorldMatrices();
    if (this.shader) {
      this.shader.setFloat(ShaderUniformsEnum.U_TIME, this._time);
      this.shader.setVec2(ShaderUniformsEnum.U_SCREEN_RESOLUTION, [CanvasViewport.rendererWidth, CanvasViewport.rendererHeight]);
      this.shader.loadDataIntoShader();
    }
  }

  /**
   * Sets the current render target to a specific texture.
   * This function creates or reuses a Framebuffer Object (FBO) and attaches the provided texture.
   * All subsequent drawing calls will be rendered to this texture.
   * @param {WebGLTexture} texture - The texture to which the scene will be rendered.
   * @param {number} width - The width of the render target.
   * @param {number} height - The height of the render target.
   * @returns {void}
   */
  public setRenderTarget(texture: WebGLTexture, width: number, height: number): void {
    if (!this._gl) return;

    if (!this._framebuffer) {
      this._framebuffer = this._gl.createFramebuffer();
    }
    this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._framebuffer);

    this._gl.framebufferTexture2D(
      this._gl.FRAMEBUFFER,
      this._gl.COLOR_ATTACHMENT0,
      this._gl.TEXTURE_2D,
      texture,
      0 // Mipmap level
    );


    if (!this._depthRenderbuffer) {
      this._depthRenderbuffer = this._gl.createRenderbuffer();
    }
    this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, this._depthRenderbuffer);
    this._gl.renderbufferStorage(this._gl.RENDERBUFFER, this._gl.DEPTH_COMPONENT16, width, height);
    this._gl.framebufferRenderbuffer(
      this._gl.FRAMEBUFFER,
      this._gl.DEPTH_ATTACHMENT,
      this._gl.RENDERBUFFER,
      this._depthRenderbuffer
    );

    const status = this._gl.checkFramebufferStatus(this._gl.FRAMEBUFFER);
    if (status !== this._gl.FRAMEBUFFER_COMPLETE) {
      console.error("Framebuffer not complete!", status);
    }

    this._gl.viewport(0, 0, width, height);
  }

  /**
   * Clears the current render target and returns rendering to the main canvas.
   * This function unbinds the Framebuffer Object and restores the original viewport.
   * @returns {void}
   */
  public clearRenderTarget(): void {
    if (!this._gl) return;
    this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
    this._gl.viewport(0, 0, CanvasViewport.rendererWidth, CanvasViewport.rendererHeight);
  }

  /**
   * Starts a new rendering pass to a specific off-screen texture.
   * This function sets up the render target and clears its contents.
   * @param {WebGLTexture} texture - The texture to which the scene will be rendered.
   * @param {number} width - The width of the render target.
   * @param {number} height - The height of the render target.
   * @param {[number, number, number, number]} [clearColor] - The color to clear the framebuffer with. Defaults to a transparent black.
   * @returns {void}
   */
  public startPass(texture: WebGLTexture, width: number, height: number, clearColor: [number, number, number, number] = [0, 0, 0, 0]): void {
    this.setRenderTarget(texture, width, height);
    this._gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
    this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
  }

  /**
   * Ends the current rendering pass and switches back to the default framebuffer (the canvas).
   * @returns {void}
   */
  public endPass(): void {
    this.clearRenderTarget();
  }


  /**
   * Serializes the renderer's state to a JSON object.
   * This is used for saving the scene or entity state.
   * @override
   * @returns {JsonSerializedData} The JSON object representation of the renderer.
   */
  override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      shader: this.shader?.toJsonObject(),
      mesh: this.mesh.toJsonObject(),
    };
  }

  /**
   * Deserializes the renderer's state from a JSON object.
   * This is used for loading a scene or entity state.
   * @override
   * @param {JsonSerializedData} jsonObject - The JSON object to deserialize from.
   * @returns {void}
   */
  public override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    const materialData = jsonObject["shader"]["material"];
    const material = ObjectInstanciator.instanciateObjectFromJsonData<Material>(materialData.className);
    material!.fromJson(materialData);
    this.shader = ObjectInstanciator.instanciateObjectFromJsonData(jsonObject["shader"].className, [this._gl, material]);
    this.shader?.fromJson(jsonObject["shader"]);
    this.mesh.fromJson(jsonObject["mesh"]);
  }

  /**
   * Draws a single point at the specified coordinates using the current shader.
   * This method temporarily uses a vertex buffer to upload the point's data and draws it using GL_POINTS.
   * @param {Vector3} point - The 3D coordinates of the point to draw`.
   * @returns {void}
   * @param {number} [pointSize=10.0] - The size of the point to draw.
   * @param {Shader} [shader=this.shader] - The shader to use for drawing.
   */
  public drawPoint(point: Vector3, pointSize: number = 10.0, shader: Shader = this.shader!): void {
    if (!this._gl || !shader || !shader.buffers.position || !shader._shaderProgram) {
      console.warn("Renderer is not fully initialized. Cannot draw point.");
      return;
    }

    // Set the primitive type for a point
    this.drawPrimitiveType = GLPrimitiveType.POINTS;
    // Use the main shader and set uniforms
    shader.use();
    this.setShaderVariables();

    shader.setFloat('u_pointSize', pointSize);
    // Bind the vertex buffer and upload point data
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, shader.buffers.position);
    this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(point.vector), this._gl.STATIC_DRAW);

    // Get the position attribute location and enable it
    const positionAttributeLocation = this._gl.getAttribLocation(shader._shaderProgram, ShaderUniformsEnum.A_POSITION);
    this._gl.enableVertexAttribArray(positionAttributeLocation);

    // Point the attribute to the buffer
    this._gl.vertexAttribPointer(positionAttributeLocation, 3, this._gl.FLOAT, false, 0, 0);

    // Draw the single point
    this._gl.drawArrays(this._gl.POINTS, 0, 1);

    // Clean up
    this._gl.disableVertexAttribArray(positionAttributeLocation);
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
  }

  /**
   * Draws a line between two specified coordinates using the current shader.
   * This method temporarily uses a vertex buffer to upload the line's data and draws it using GL_LINES.
   * @param {Vector3} start - The 3D coordinates of the line's starting point, e.g., `[x, y, z]`.
   * @param {Vector3} end - The 3D coordinates of the line's ending point, e.g., `[x, y, z]`.
   * @returns {void}
   */
  public drawLine(start: Vector3, end: Vector3): void {
    if (!this._gl || !this.shader || !this.shader.buffers.position) {
      console.warn("Renderer is not fully initialized. Cannot draw line.");
      return;
    }

    // Combine the start and end points into a single vertex array
    const lineVertices = [...start.vector, ...end.vector];

    // Set the primitive type for a line
    this.drawPrimitiveType = GLPrimitiveType.LINES;

    // Use the main shader and set uniforms
    this.shader.use();
    this.setShaderVariables();

    // Bind the vertex buffer and upload line data
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.shader.buffers.position);
    this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(lineVertices), this._gl.STATIC_DRAW);

    // Get the position attribute location and enable it
    const positionAttributeLocation = this._gl.getAttribLocation(this.shader._shaderProgram!, ShaderUniformsEnum.A_POSITION);
    this._gl.enableVertexAttribArray(positionAttributeLocation);

    // Point the attribute to the buffer
    this._gl.vertexAttribPointer(positionAttributeLocation, 3, this._gl.FLOAT, false, 0, 0);

    // Draw the two vertices as a line
    this._gl.drawArrays(this._gl.LINES, 0, 2);

    // Clean up
    this._gl.disableVertexAttribArray(positionAttributeLocation);
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
  }


  /**
   * Draws the mesh to the canvas.
   * @override
   * @returns {void}
   */
  override draw(): void {
    if (!this.mesh || !this.shader?._shaderProgram) {
      return;
    }
    this.shader.use();
    this.shader.bindBuffers();
    this._gl.drawElements(this.drawPrimitiveType, this.mesh.meshData.indices.length, this._gl.UNSIGNED_SHORT, 0);
  }


  /**
   * Updates the renderer's internal state.
   * @override
   * @param {number} elapsed - The time elapsed since the last update in milliseconds.
   * @returns {void}
   */
  override update(elapsed: number): void {
    super.update(elapsed);
    this._time += elapsed;
  }

  /**
   * Sets this object's gl instance.
   * @param {WebGL2RenderingContext} gl - The WebGL2 rendering context.
   * @returns {void}
   */
  public setGl(gl: WebGL2RenderingContext) {
    this._gl = gl;
  }

  /**
   * Calculates the view, projection, and model-view-projection matrices for a light source.
   * These matrices are used in shadow mapping to render the scene from the light's perspective.
   *
   * @param {Transform} cameraTransform - The transform of the main camera.
   * @param {Transform} lightTransform - The transform of the light source.
   * @param {number} [frustumSize=60.0] - The size of the orthographic frustum used for the light's projection.
   * @param {number} [near=0.1] - The near clipping plane of the light's frustum.
   * @param {number} [far=200.0] - The far clipping plane of the light's frustum.
   * @returns {{ lightViewMatrix: mat4, lightProjectionMatrix: mat4, lightMvpMatrix: mat4 }} An object containing the calculated matrices.
   */
  public createLightMatrices(
    cameraTransform: Transform,
    lightTransform: Transform,
    frustumSize: number = 60.0,
    near: number = 0.1,
    far: number = 200.0,
  ) {
    // 1. Get the light's direction from the new 'lightTransform' parameter.
    const lightDirection = vec3.normalize(vec3.create(), lightTransform.forward);

    // 2. Determine the center of the light's view frustum.
    // It is centered on the camera's position for consistent shadow coverage.
    const frustumCenter = vec3.create();
    vec3.copy(frustumCenter, cameraTransform.worldPosition);

    // 3. Create the light's eye position by offsetting it from the frustum center.
    const lightPosition = vec3.create();
    vec3.scaleAndAdd(lightPosition, frustumCenter, lightDirection, -(frustumSize));

    // 4. Calculate the light's view matrix using mat4.lookAt.
    // To prevent the matrix from becoming unstable when the light is directly
    // above or below, we calculate a stable 'up' vector.
    let up = vec3.fromValues(0, 1, 0);
    if (Math.abs(vec3.dot(lightDirection, up)) > 0.999) {
      // If light direction is too close to the world up vector, use a different axis.
      up = vec3.fromValues(0, 0, 1);
    }
    const lightRight = vec3.cross(vec3.create(), lightDirection, up);
    const lightUp = vec3.cross(vec3.create(), lightRight, lightDirection);

    const lightViewMatrix = mat4.create(); // Variable declared here
    mat4.lookAt(
      lightViewMatrix,
      lightPosition,
      frustumCenter,
      lightUp
    );

    // 5. Calculate the light's projection matrix.
    const lightProjectionMatrix = mat4.create(); // Variable declared here
    mat4.ortho(
      lightProjectionMatrix,
      -frustumSize,
      frustumSize,
      -frustumSize,
      frustumSize,
      near,
      far
    );

    // 6. Calculate the final combined Light MVP Matrix.
    const lightMvpMatrix = mat4.create(); // Variable declared here
    mat4.multiply(lightMvpMatrix, lightProjectionMatrix, lightViewMatrix);

    // 7. Return all the necessary matrices in an object.
    return {
      lightViewMatrix,
      lightProjectionMatrix,
      lightMvpMatrix
    };
  }
}
