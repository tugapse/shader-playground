import { TexturedRendererBehaviour, SceneEntityBehaviour, RendererBehaviour, ColorMaterial, Shader, GLPrimitiveType, Mesh, EngineCache, Scene, Camera, GlEntity, JsonSerializedData } from "omega-game-engine";

export class EditorRenderBehaviour extends TexturedRendererBehaviour implements SceneEntityBehaviour {

  protected handleRenderer!: RendererBehaviour;
  protected instanceBuffer: WebGLBuffer | null = null; // Initialize to null
  protected instanceData: Float32Array; // Declare instanceData here
  protected instanceCount: number = 0;
  protected isInitialized: boolean = false; // Flag to track initialization status

  // Store the attribute location once
  private aInstanceModelMatrixLocation: number = -1;

  constructor(gl: WebGL2RenderingContext) {
    super(gl);

    // Initialize instanceData with a reasonable initial size, or dynamically resize later
    // For editor, you might pre-allocate for max expected objects, or grow it.
    this.instanceData = new Float32Array(16 * 1000); // Example: space for 1000 instances

    // Create the instance buffer once during construction
    this.instanceBuffer = this._gl.createBuffer();
    if (!this.instanceBuffer) {
      console.error("Failed to create instance buffer during EditorRenderBehaviour construction.");
      return;
    }

    const material = new ColorMaterial();
    this.shader = new Shader(this._gl, material);
    this.shader.fragUri = "assets/shaders/frag/color.frag";
    this.shader.vertexUri = "assets/shaders/editor/handle/handle.vert";
    this.shader.recompile();
    this.shader.initialize();



    this.handleRenderer = new RendererBehaviour(this._gl); // Assuming this needs a ready shader
    this.drawPrimitiveType = GLPrimitiveType.TRIANGLES;

    this.mesh = new Mesh();
    EngineCache.getMeshDataFromObj("assets/primitives/axis.obj").then(loadedMeshData => {
      this.mesh.meshData = loadedMeshData;

      this.isInitialized = true; // Mark as ready to draw
      console.log("EditorRenderBehaviour initialized and ready.");

    }).catch(error => {
      console.error("Failed to load editor mesh data:", error);
    });

  }

  beforeUpdate(ellapsed: number): void { }
  afterUpdate(): void { }
  beforeDraw(): void { }

  /**
    Draws the mesh to the canvas using instanced rendering.
   * @override
   */
  override draw(): void {
    this.instanceCount = (this.parent as Scene).objects.length

    if (!this.isInitialized || !this.mesh || !this.shader?.shaderProgram || !this.instanceBuffer || this.instanceCount <= 0) {
      return;
    }
    // Shader is ready, get attribute location
    this.aInstanceModelMatrixLocation = this._gl.getAttribLocation(this.shader!.shaderProgram, 'aInstanceModelMatrix');

    if (this.aInstanceModelMatrixLocation === -1) {
      console.error("Attribute 'aInstanceModelMatrix' not found in editor shader. Critical for instanced rendering.");
      // Handle error appropriately, maybe fallback to non-instanced or disable rendering
      return;
    }


    // 1. Update transforms and instance data *before* binding buffers for drawing
    this.updateInstanceTransforms();
    // Perform setupInstancedAttributes ONLY ONCE after shader and buffer are ready
    this.setupInstancedAttributes(this.aInstanceModelMatrixLocation);





    // Set common uniforms (projection, view matrices) here or in a higher-level renderer
    // Example: assuming you have access to a camera's matrices

    this.shader.bindBuffers();
    this.shader.use();
    this.shader.setMat4('uProjectionMatrix', Camera.mainCamera.projectionMatrix);
    this.shader.setMat4('uViewMatrix', Camera.mainCamera.viewMatrix);
    // Bind the instance buffer (already set up in setupInstancedAttributes)
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.instanceBuffer);

    // The attributes are already enabled and pointed in setupInstancedAttributes,
    // so we just need to draw.
    this._gl.drawElementsInstanced(
      this.drawPrimitiveType,
      this.mesh.meshData.indices.length,
      this._gl.UNSIGNED_SHORT, // Type of indices
      0,                       // Offset into the index buffer
      this.instanceCount      // The number of instances to render
    );

    // Unbind the instance buffer to avoid affecting subsequent draws
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);

  }
  protected override setShaderVariables(): void {
    if (!this.shader?.shaderProgram || !Camera.mainCamera) return
    this.shader.setMat4('uProjectionMatrix', new Float32Array(Camera.mainCamera.projectionMatrix));
    this.shader.setMat4('uViewMatrix', new Float32Array(Camera.mainCamera.viewMatrix));
    super.setShaderVariables();
  }
  afterDraw(): void {
    // This can be empty if all rendering logic is in draw()
  }

  /**
   * Updates the instance buffer with new data.
   * @param instanceData A Float32Array containing the per-instance data (e.g., flattened model matrices).
   */
  private uploadInstanceDataToGPU(instanceData: Float32Array) {
    if (!this._gl || !this.instanceBuffer) {
      console.error("WebGL context or instance buffer not available to update instance data.");
      return;
    }

    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.instanceBuffer);
    // Use gl.bufferSubData if you know the data size won't change, for minor optimization
    // but for dynamic object counts, gl.bufferData is fine.
    this._gl.bufferData(this._gl.ARRAY_BUFFER, instanceData, this._gl.STATIC_DRAW);
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);

    // Update the instance count based on the number of matrices provided
    // Assuming each matrix is 16 floats.
    this.instanceCount = instanceData.length / 16;
  }

  /**
   * Sets up the instanced vertex attributes for the shader.
   * This should be called once after creating and populating the instance buffer.
   * Assumes per-instance model matrices (mat4) are being passed.
   * @param attributeLocation The starting location of the attribute for the instanced data in the shader.
   * If using per-instance `mat4`, this will typically be 4 consecutive attribute locations.
   */
  private setupInstancedAttributes(attributeLocation: number) {
    if (!this._gl || !this.shader?.shaderProgram || !this.instanceBuffer) {
      console.error("WebGL context, shader program, or instance buffer not available for instanced attribute setup.");
      return;
    }

    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.instanceBuffer);

    // Assuming each instance provides a 4x4 model matrix (16 floats)
    const stride = 16 * Float32Array.BYTES_PER_ELEMENT; // Stride for a mat4

    // A mat4 takes up 4 generic vertex attributes (vec4)
    for (let i = 0; i < 4; ++i) {
      this._gl.enableVertexAttribArray(attributeLocation + i);
      this._gl.vertexAttribPointer(
        attributeLocation + i,
        4, // Each row of the matrix is a vec4
        this._gl.FLOAT,
        false,
        stride,
        i * 4 * Float32Array.BYTES_PER_ELEMENT // Offset to the i-th row of the matrix
      );
      // This is the key: tell WebGL to advance this attribute once per instance, not once per vertex
      this._gl.vertexAttribDivisor(attributeLocation + i, 1);
    }

    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null); // Unbind after setup
  }

  /**
   * Gathers transforms from scene objects, updates them, and uploads to GPU.
   * This should be called every frame *before* the actual draw call.
   */
  private updateInstanceTransforms() {
    // Check if the parent is a Scene entity and has an 'objects' property
    if (!this.parent || !(this.parent instanceof GlEntity) || !(this.parent as Scene).objects) {
      console.warn("EditorRenderBehaviour parent is not a Scene or lacks 'objects'. Cannot collect transforms.");
      this.instanceCount = 0; // Ensure no drawing if no objects
      return;
    }

    const parentScene = this.parent as Scene; // Cast to Scene for type safety
    const sceneObjects = parentScene.objects;
    const numSceneObjects = sceneObjects.length;

    // Ensure instanceData array is large enough. Dynamically resize if needed.
    if (this.instanceData.length < numSceneObjects * 16) {
      // console.log(`Resizing instanceData from ${this.instanceData.length} to ${numSceneObjects * 16}`);
      this.instanceData = new Float32Array(numSceneObjects * 16);
    }

    for (let i = 0; i < numSceneObjects; ++i) {
      const glEntity = sceneObjects[i] as GlEntity; // Assuming objects in scene are GlEntities
      if (glEntity && glEntity.transform) {
        // Ensure the transform's matrices are up-to-date
        glEntity.transform.updateMatrices();
        // Copy the world-space modelMatrix from your Transform instance
        this.instanceData.set(glEntity.transform.modelMatrix, i * 16);
      } else {
        console.warn(`Scene object at index ${i} is missing transform or is not a GlEntity.`);
        // You might want to skip this instance or handle it specially
      }
    }

    // THIS is the only place we upload data to the GPU buffer after all transforms are gathered
    this.uploadInstanceDataToGPU(this.instanceData);
  }

  override toJsonObject(): JsonSerializedData {
    return super.toJsonObject();
  }
}
