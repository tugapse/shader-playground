import { vec3, mat4 } from 'gl-matrix';

export class Transform {

  private _position!: vec3;
  private _rotation!: vec3; // Stored in radians
  private _scale!: vec3;

  private _modelMatrix!: mat4;
  public get modelMatrix() { return this._modelMatrix; }
  public get position() { return this._position; }
  public get rotation() { return this._rotation; } // Returns rotation in radians
  public get localScale() { return this._scale; }

  constructor() {
    this._position = vec3.create();
    this._rotation = vec3.create();
    this._scale = vec3.fromValues(1, 1, 1);
    this._modelMatrix = mat4.create();
    this.updateModelMatrix();
  }

  public setPosition(x: number = 0, y: number = 0, z: number = 0) {
    vec3.set(this._position, x, y, z);
    this.updateModelMatrix();
  }

  public setRotation(x: number = 0, y: number = 0, z: number = 0) {
    // Expects input in radians
    vec3.set(this._rotation, x, y, z);
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

  public rotate(x: number = 0, y: number = 0, z: number = 0) {
    // Expects input in radians, adds to current rotation
    vec3.add(this._rotation, this._rotation, vec3.fromValues(x, y, z));
    this.updateModelMatrix();
  }

  public scale(x: number = 1, y: number = 1, z: number = 1) {
    vec3.multiply(this._scale, this._scale, vec3.fromValues(x, y, z));
    this.updateModelMatrix();
  }

  public updateModelMatrix() {
    mat4.identity(this._modelMatrix);
    // Correct Order: Scale -> Rotate -> Translate
    mat4.scale(this._modelMatrix, this._modelMatrix, this._scale); // Scale first
    mat4.rotateX(this._modelMatrix, this._modelMatrix, this._rotation[0]);
    mat4.rotateY(this._modelMatrix, this._modelMatrix, this._rotation[1]);
    mat4.rotateZ(this._modelMatrix, this._modelMatrix, this._rotation[2]);
    mat4.translate(this._modelMatrix, this._modelMatrix, this._position); // Translate last
  }

  // --- Local Unit Vector Getters ---

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
