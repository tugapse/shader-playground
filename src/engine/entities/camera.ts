import { mat4, vec3, vec4, vec2 } from 'gl-matrix';
import { Transform } from "../core/transform";
import { EntityType } from "../enums/entity-type.enum";
import { JsonSerializedData } from "../interfaces/json-serialized-data.interface";
import { GlEntity } from "./entity";

/**
 * Represents a camera in the 3D scene, responsible for generating the view and projection matrices.
 * @augments {GlEntity}
 */
export class Camera extends GlEntity {
  protected override _className = "Camera";

  /**
   * The main camera instance for the scene.
   * @private
   * @type {Camera}
   */
  private static _mainCamera: Camera;
  /**
   * Gets the main camera instance.
   * @readonly
   * @type {Camera}
   */
  public static get mainCamera(): Camera {
    return this._mainCamera;
  }
  /**
   * The camera's field of view in DEGREES.
   * @type {number}
   */
  public fieldOfView: number = 45;
  /**
   * The distance to the near clipping plane.
   * @type {number}
   */
  public nearPlane: number = 0.1;
  /**
   * The distance to the far clipping plane.
   * @type {number}
   */
  public farPlane: number = 2000.0;
  /**
   * The aspect ratio of the viewport.
   * @type {number}
   */
  public aspectRatio: number = 1;
  /**
   * The projection matrix of the camera.
   * @private
   * @type {mat4}
   */
  private _projectionMatrix!: mat4;
  /**
   * The view matrix of the camera.
   * @private
   * @type {mat4}
   */
  private _viewMatrix!: mat4;
  /**
   * The tag for the camera entity.
   * @override
   * @type {string}
   */
  public override tag: string = "Camera";
  /**
   * Gets the projection matrix.
   * @readonly
   * @type {mat4}
   */
  public get projectionMatrix(): mat4 {
    return this._projectionMatrix;
  }
  /**
   * Gets the view matrix.
   * @readonly
   * @type {mat4}
   */
  public get viewMatrix(): mat4 {
    return this._viewMatrix;
  }

  /**
   * Creates an instance of Camera.
   */
  constructor() {
    super("Camera");
    this.entityType = EntityType.CAMERA;
    this._projectionMatrix = mat4.create();
    this._viewMatrix = mat4.create();
  }

  /**
   * Sets the main camera instance for static access.
   * @param {Camera} camera - The camera to set as the main camera.
   * @returns {void}
   */
  public static setMainCamera(camera: Camera): void {
    this._mainCamera = camera;
  }

  /**
   * Initializes the camera, updating its matrices.
   * @override
   * @returns {void}
   */
  override initialize(): void {
    this.updateProjectionMatrix();
    this.updateViewMatrix();
    super.initialize();
  }

  /**
   * Updates the camera's projection matrix based on its current fieldOfView, aspectRatio, nearPlane, and farPlane.
   * This should be called whenever the viewport dimensions change.
   * @returns {void}
   */
  public updateProjectionMatrix(): void {
    mat4.perspective(
      this._projectionMatrix,
      (this.fieldOfView * Math.PI) / 180,
      this.aspectRatio,
      this.nearPlane,
      this.farPlane
    );
  }

  /**
   * Updates the camera's view matrix based on its current transform (position and rotation).
   * @private
   * @returns {void}
   */
  private updateViewMatrix(): void {
    const cameraPosition = this.transform.worldPosition;
    const lookAtTarget = vec3.add(vec3.create(), cameraPosition, this.transform.forward);
    const cameraUp = this.transform.up;
    mat4.lookAt(this._viewMatrix, cameraPosition, lookAtTarget, cameraUp);
  }

  /**
   * Updates the camera each frame.
   * @override
   * @param {number} ellapsed - The elapsed time since the last update.
   * @returns {void}
   */
  override update(ellapsed: number): void {
    this.updateViewMatrix();
    super.update(ellapsed);
  }

  /**
   * Converts a world position to a 2D screen coordinate.
   * @param {vec3} worldPosition - The world position vector to convert.
   * @param {number} viewportWidth - The width of the viewport in pixels.
   * @param {number} viewportHeight - The height of the viewport in pixels.
   * @returns {vec2} The 2D screen position in pixels.
   */
  public worldToScreenPosition(worldPosition: vec3, viewportWidth: number, viewportHeight: number): vec2 {
    // Combine view and projection matrices
    const viewProjectionMatrix = mat4.create();
    mat4.multiply(viewProjectionMatrix, this._projectionMatrix, this._viewMatrix);

    // Transform the world position to clip-space
    const clipSpacePosition = vec4.fromValues(worldPosition[0], worldPosition[1], worldPosition[2], 1.0);
    vec4.transformMat4(clipSpacePosition, clipSpacePosition, viewProjectionMatrix);

    // Perform perspective division to get normalized device coordinates (NDC)
    if (clipSpacePosition[3] === 0) {
      // Prevent division by zero
      return vec2.fromValues(0, 0);
    }
    const ndcPosition = vec3.fromValues(
      clipSpacePosition[0] / clipSpacePosition[3],
      clipSpacePosition[1] / clipSpacePosition[3],
      clipSpacePosition[2] / clipSpacePosition[3]
    );

    // Convert NDC to screen coordinates
    const screenPositionX = (ndcPosition[0] * 0.5 + 0.5) * viewportWidth;
    const screenPositionY = (ndcPosition[1] * -0.5 + 0.5) * viewportHeight; // Y-axis inversion for typical screen coordinates

    return vec2.fromValues(screenPositionX, screenPositionY);
  }

  /**
   * Unprojects a 2D screen coordinate into a 3D ray in world space.
   * This is useful for picking objects with the mouse.
   * @param {vec2} screenPosition - The 2D screen position in pixels (e.g., from mouse input).
   * @param {number} viewportWidth - The width of the viewport in pixels.
   * @param {number} viewportHeight - The height of the viewport in pixels.
   * @returns {{origin: vec3, direction: vec3}} An object containing the ray's origin and direction vectors.
   */
  public screenToWorldRay(screenPosition: vec2, viewportWidth: number, viewportHeight: number): { origin: vec3, direction: vec3 } {
    // 1. Convert screen coordinates to Normalized Device Coordinates (NDC)
    const ndcScreenX = (2.0 * screenPosition[0]) / viewportWidth - 1.0;
    const ndcScreenY = 1.0 - (2.0 * screenPosition[1]) / viewportHeight; // Y-axis inversion

    // 2. Create the combined view-projection matrix and its inverse
    const viewProjectionMatrix = mat4.create();
    mat4.multiply(viewProjectionMatrix, this._projectionMatrix, this._viewMatrix);
    const inverseViewProjectionMatrix = mat4.create();
    mat4.invert(inverseViewProjectionMatrix, viewProjectionMatrix);

    // 3. Transform near and far points to world space
    const nearPointNdc = vec4.fromValues(ndcScreenX, ndcScreenY, -1.0, 1.0); // Z = -1 for the near plane
    const farPointNdc = vec4.fromValues(ndcScreenX, ndcScreenY, 1.0, 1.0);   // Z = 1 for the far plane

    const nearPointWorld = vec4.create();
    vec4.transformMat4(nearPointWorld, nearPointNdc, inverseViewProjectionMatrix);

    const farPointWorld = vec4.create();
    vec4.transformMat4(farPointWorld, farPointNdc, inverseViewProjectionMatrix);

    // 4. Perform perspective division
    if (nearPointWorld[3] === 0 || farPointWorld[3] === 0) {
      // Prevent division by zero
      return { origin: vec3.fromValues(0, 0, 0), direction: vec3.fromValues(0, 0, 0) };
    }
    const rayOrigin = vec3.fromValues(
      nearPointWorld[0] / nearPointWorld[3],
      nearPointWorld[1] / nearPointWorld[3],
      nearPointWorld[2] / nearPointWorld[3]
    );

    const farPoint = vec3.fromValues(
      farPointWorld[0] / farPointWorld[3],
      farPointWorld[1] / farPointWorld[3],
      farPointWorld[2] / farPointWorld[3]
    );

    // 5. Calculate the ray direction
    const rayDirection = vec3.create();
    vec3.subtract(rayDirection, farPoint, rayOrigin);
    vec3.normalize(rayDirection, rayDirection);

    return { origin: rayOrigin, direction: rayDirection };
  }

  /**
   * Unprojects a 2D screen coordinate to a specific 3D world position at a given distance from the camera.
   * This is useful for placing objects directly in front of the camera based on mouse input.
   * @param {vec2} screenPosition - The 2D screen position in pixels (e.g., from mouse input).
   * @param {number} distance - The distance from the camera along the ray.
   * @param {number} viewportWidth - The width of the viewport in pixels.
   * @param {number} viewportHeight - The height of the viewport in pixels.
   * @returns {vec3} The 3D world position.
   */
  public screenToWorldPosition(screenPosition: vec2, distance: number, viewportWidth: number, viewportHeight: number): vec3 {
    const { origin, direction } = this.screenToWorldRay(screenPosition, viewportWidth, viewportHeight);
    const worldPosition = vec3.create();
    vec3.scaleAndAdd(worldPosition, origin, direction, distance);
    return worldPosition;
  }

  /**
   * Converts a 3D world position to a 4D clip-space position.
   * This is the final step before the hardware performs the perspective divide and rasterization.
   * @param {vec3} worldPosition - The 3D world position vector to convert.
   * @returns {vec4} The 4D clip-space position vector.
   */
  public worldToClipPosition(worldPosition: vec3): vec4 {
    const viewProjectionMatrix = mat4.create();
    mat4.multiply(viewProjectionMatrix, this._projectionMatrix, this._viewMatrix);
    const clipSpacePosition = vec4.fromValues(worldPosition[0], worldPosition[1], worldPosition[2], 1.0);
    vec4.transformMat4(clipSpacePosition, clipSpacePosition, viewProjectionMatrix);
    return clipSpacePosition;
  }

  /**
   * Serializes the camera's state to a JSON object.
   * @override
   * @returns {JsonSerializedData} - The JSON object representation.
   */
  override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      fieldOfView: this.fieldOfView,
      nearPlane: this.nearPlane,
      farPlane: this.farPlane,
      aspectRatio: this.aspectRatio,
    };
  }

  /**
   * Creates a new Camera instance.
   * @override
   * @param {string} [name="Camera"] - The name of the camera.
   * @param {Transform} [transform] - The transform for the camera.
   * @returns {Camera} - The newly created Camera instance.
   */
  static override instanciate(name?: string, transform?: Transform): Camera {
    const camera = new Camera();
    camera.name = name || camera.name;
    camera.transform = transform || camera.transform;
    return camera;
  }
}
