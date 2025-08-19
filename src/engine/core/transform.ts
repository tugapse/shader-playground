import { JsonSerializable } from '@engine/interfaces/json-serializable';
import { vec3, mat4, quat } from 'gl-matrix'; // Import quat

export class Transform implements JsonSerializable {

  private _position!: vec3;
  private _rotation!: quat; // Changed: Store rotation as a quaternion
  private _scale!: vec3;

  private _modelMatrix!: mat4;
  public get modelMatrix() { return this._modelMatrix; }
  public get position() { return this._position; }
  public get rotation() { return this._rotation; } // Returns the quaternion
  public get localScale() { return this._scale; }

  constructor() {
    this._position = vec3.create();
    this._rotation = quat.create(); // Initialize as an identity quaternion
    this._scale = vec3.fromValues(1, 1, 1);
    this._modelMatrix = mat4.create();
    this.updateModelMatrix();
  }



  public setPosition(x: number = 0, y: number = 0, z: number = 0) {
    vec3.set(this._position, x, y, z);
    this.updateModelMatrix();
  }

  /**
   * Sets the absolute rotation using Euler angles (pitch, yaw, roll).
   * Converts Euler angles to a quaternion.
   * @param xRadians Pitch (rotation around X-axis).
   * @param yRadians Yaw (rotation around Y-axis).
   * @param zRadians Roll (rotation around Z-axis).
   */
  public setRotation(xRadians: number = 0, yRadians: number = 0, zRadians: number = 0) {
    // Convert Euler angles (XYZ order) to a quaternion
    quat.fromEuler(this._rotation, xRadians * 180 / Math.PI, yRadians * 180 / Math.PI, zRadians * 180 / Math.PI); // gl-matrix fromEuler expects degrees
    this.updateModelMatrix();
  }

  public setScale(x: number = 1, y: number = 1, z: number = 1) {
    vec3.set(this._scale, x, y, z);
    this.updateModelMatrix();
  }

  public translate(x: number = 0, y: number = 0, z: number = 0) {
    vec3.add(this._position, this._position, vec3.fromValues(x, y, z));
    this.updateModelMatrix();
  }

  /**
   * Applies an incremental rotation around the object's local axes.
   * This accumulates rotation correctly using quaternions.
   * @param xRadians Radians to rotate around the local X-axis.
   * @param yRadians Radians to rotate around the local Y-axis.
   * @param zRadians Radians to rotate around the local Z-axis.
   */
  public rotate(xRadians: number = 0, yRadians: number = 0, zRadians: number = 0) {
    // Create incremental rotation quaternions for each axis
    const rotX = quat.setAxisAngle(quat.create(), [1, 0, 0], xRadians);
    const rotY = quat.setAxisAngle(quat.create(), [0, 1, 0], yRadians);
    const rotZ = quat.setAxisAngle(quat.create(), [0, 0, 1], zRadians);

    // Apply new rotations to the existing rotation.
    // Order matters: Apply Z, then Y, then X to current rotation (for extrinsic XYZ rotations)
    // Or multiply in desired order for intrinsic rotations.
    // For general object rotation, apply to current quaternion:
    quat.multiply(this._rotation, this._rotation, rotX);
    quat.multiply(this._rotation, this._rotation, rotY);
    quat.multiply(this._rotation, this._rotation, rotZ);

    this.updateModelMatrix();
  }

  public scale(x: number = 1, y: number = 1, z: number = 1) {
    vec3.multiply(this._scale, this._scale, vec3.fromValues(x, y, z));
    this.updateModelMatrix();
  }

  public updateModelMatrix() {
    // Use mat4.fromRotationTranslationScale to build the matrix efficiently
    // This function automatically handles the correct order: Scale -> Rotate -> Translate
    mat4.fromRotationTranslationScale(this._modelMatrix, this._rotation, this._position, this._scale);
  }

  // --- Local Unit Vector Getters (MODIFIED FOR +Z FORWARD) ---

  /**
   * Returns the object's local Right (positive X) direction in world space.
   */
  public get right(): vec3 {
    return vec3.fromValues(this._modelMatrix[0], this._modelMatrix[1], this._modelMatrix[2]);
  }

  /**
   * Returns the object's local Left (negative X) direction in world space.
   */
  public get left(): vec3 {
    return vec3.negate(vec3.create(), this.right);
  }

  /**
   * Returns the object's local Up (positive Y) direction in world space.
   */
  public get up(): vec3 {
    return vec3.fromValues(this._modelMatrix[4], this._modelMatrix[5], this._modelMatrix[6]);
  }

  /**
   * Returns the object's local Down (negative Y) direction in world space.
   */
  public get down(): vec3 {
    return vec3.negate(vec3.create(), this.up);
  }

  /**
   * Returns the object's local Forward (positive Z) direction in world space.
   * This is now aligned with the model's +Z axis.
   */
  public get forward(): vec3 {
    // Now, 'forward' is directly the Z-axis of the model matrix
    return vec3.fromValues(this._modelMatrix[8], this._modelMatrix[9], this._modelMatrix[10]);
  }

  /**
   * Returns the object's local Backward (negative Z) direction in world space.
   * This is now aligned with the model's -Z axis.
   */
  public get back(): vec3 {
    return vec3.negate(vec3.create(), this.forward);
  }

  /**
   * Makes the object look at a specified target point.
   * This modifies the object's rotation quaternion.
   * This version is adjusted for a +Z forward model convention.
   * @param target The world-space point to look at.
   * @param worldUp An optional world-space up vector. Defaults to the global Y-axis (positive up).
   */
  public lookAt(target: vec3, worldUp?: vec3): void {
    const defaultWorldUp = vec3.fromValues(0, 1, 0); // Default to global Y-up
    const effectiveUp = worldUp || defaultWorldUp;

    // Calculate the direction vector from the current position to the target
    const direction = vec3.subtract(vec3.create(), target, this._position);
    vec3.normalize(direction, direction);

    // To align the object's +Z forward with the target:
    // We need to calculate a rotation that maps the positive Z-axis to the `direction` vector.
    // An alternative is to use the `mat4.lookAt` to get a *view* matrix, and then
    // derive the object's rotation from its inverse.
    //
    // However, since `mat4.lookAt` computes a view matrix that looks *down the negative Z-axis*,
    // if we want our *object's positive Z-axis* to point towards the target, we can
    // simply tell `mat4.lookAt` to point its eye *from the target back to us*,
    // then invert the result. This will naturally orient the +Z of the resulting
    // model matrix (after inversion) to face our target.

    const tempViewMatrix = mat4.create();
    // Compute a view matrix as if a camera were at 'target' looking back at 'this.position'
    mat4.lookAt(tempViewMatrix, target, this._position, effectiveUp);

    const tempModelMatrix = mat4.create();
    // Invert it to get the model matrix for an object that is at 'this.position'
    // and correctly oriented so its +Z points towards 'target'.
    mat4.invert(tempModelMatrix, tempViewMatrix);

    // Extract the rotation quaternion directly from this model matrix
    mat4.getRotation(this._rotation, tempModelMatrix);

    // No need for quat.rotateY(..., Math.PI) anymore because we've aligned
    // the calculation with the desired +Z forward convention.

    this.updateModelMatrix();
  }

  public toJsonObject(): { position: number[], rotation: number[], scale: number[] } {
    return {
      position: [this._position[0], this._position[1], this._position[2]],
      rotation: [this._rotation[0], this._rotation[1], this._rotation[2]],
      scale: [this._scale[0], this._scale[1], this._scale[2]],
    }
  }

  public fromJson(jsonObject: { [key: string]: any; }): void {
    this._position = vec3.fromValues(jsonObject['position'][0], jsonObject['position'][1], jsonObject['position'][2]);
    this._rotation = vec3.fromValues(jsonObject['rotation'][0], jsonObject['rotation'][1], jsonObject['rotation'][2]);
    this._scale = vec3.fromValues(jsonObject['scale'][0], jsonObject['scale'][1], jsonObject['scale'][2]);
    this.updateModelMatrix();
  }
}
