import { vec3, mat4, quat } from 'gl-matrix'; // Import quat

export class Transform {

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

  // --- Local Unit Vector Getters (These are correct) ---

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
   * Returns the object's local Forward (negative Z) direction in world space.
   */
  public get forward(): vec3 {
    // In WebGL/OpenGL, the default camera faces down the negative Z-axis,
    // so 'forward' for an object is often the negative of its local Z-axis.
    return vec3.fromValues(-this._modelMatrix[8], -this._modelMatrix[9], -this._modelMatrix[10]);
  }

  /**
   * Returns the object's local Backward (positive Z) direction in world space.
   */
  public get back(): vec3 {
    return vec3.fromValues(this._modelMatrix[8], this._modelMatrix[9], this._modelMatrix[10]);
  }
}
