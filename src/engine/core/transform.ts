import { vec3, mat4, quat } from 'gl-matrix';
import { v4 as uuidv4 } from 'uuid';
import { JsonSerializable } from './json-serializable';
import { JsonSerializedData } from '../interfaces/json-serialized-data.interface';
import { GlEntity } from '../entities';

/**
 * A helper function to convert a quaternion to Euler angles in radians.
 * This function handles Gimbal lock cases and ensures a consistent conversion.
 * @param {vec3} out - The vector to store the resulting Euler angles (in radians).
 * @param {quat} q - The source quaternion.
 */
function toEuler(out: vec3, q: quat): void {
  const x = q[0],
    y = q[1],
    z = q[2],
    w = q[3];
  const x2 = x * x,
    y2 = y * y,
    z2 = z * z;
  const unit = x2 + y2 + z2 + w * w;
  const test = x * w - y * z;

  if (test > 0.4995 * unit) {
    out[0] = Math.PI / 2;
    out[1] = 2 * Math.atan2(y, w);
    out[2] = 0;
  } else if (test < -0.4995 * unit) {
    out[0] = -Math.PI / 2;
    out[1] = -2 * Math.atan2(y, w);
    out[2] = 0;
  } else {
    out[0] = Math.asin(2 * (w * x - y * z));
    out[1] = Math.atan2(2 * w * y + 2 * z * x, 1 - 2 * (x2 + y2));
    out[2] = Math.atan2(2 * w * z + 2 * x * y, 1 - 2 * (z2 + y2));
  }
}

/**
 * Represents the position, rotation, and scale of an object in 3D space.
 * It manages local and world matrices and a hierarchy with a parent and children.
 * @augments {JsonSerializable}
 */
export class Transform extends JsonSerializable {

  public static get className() { return "Transform"; }

  /**
   * The local position of the transform.
   * @private
   * @type {vec3}
   */
  private _position!: vec3;
  /**
   * The rotation of the transform in degrees.
   * @private
   * @type {vec3}
   */
  private _rotationInDegrees!: vec3;
  /**
   * The rotation of the transform as a quaternion.
   * @private
   * @type {quat}
   */
  private _rotation!: quat;
  /**
   * The local scale of the transform.
   * @private
   * @type {vec3}
   */
  private _scale!: vec3;

  /**
   * The world-space model matrix.
   * @private
   * @type {mat4}
   */
  private _modelMatrix!: mat4;
  /**
   * The local-space matrix relative to its parent.
   * @private
   * @type {mat4}
   */
  private _localMatrix!: mat4;
  /**
   * The parent transform in the hierarchy.
   * @private
   * @type {Transform | null}
   */
  private _parent: Transform | null = null;

  /**
   * An array of child transforms.
   * @private
   * @type {Transform[]}
   */
  private _children: Transform[] = [];

  /**
   * A flag to indicate if the matrices need to be re-calculated.
   * @private
   * @type {boolean}
   */
  private _dirty: boolean = true;

  /**
   * Creates an instance of Transform.
   */
  constructor() {
    super("Transform");
    this._position = vec3.create();
    this._rotation = quat.create();
    this._rotationInDegrees = vec3.create();
    this._scale = vec3.fromValues(1, 1, 1);
    this._modelMatrix = mat4.create();
    this._localMatrix = mat4.create();
    this._uuid = uuidv4();
    this._dirty = true;
  }

  public parentEntity: GlEntity | null = null;

  /**
   * Gets the world-space model matrix.
   * @type {mat4}
   */
  public get modelMatrix(): mat4 {
    return this._modelMatrix;
  }

  // --- Local Space ---

  /**
   * Gets the position of the transform relative to its parent.
   * @type {vec3}
   */
  public get localPosition(): vec3 {
    return this._position;
  }

  /**
   * Gets the rotation of the transform in Euler angles (degrees), relative to its parent.
   * @type {vec3}
   */
  public get localRotation(): vec3 {
    return this._rotationInDegrees;
  }

  /**
   * Gets the rotation of the transform as a quaternion, relative to its parent.
   * @type {quat}
   */
  public get localRotationQuat(): quat {
    return quat.clone(this._rotation);
  }

  /**
   * Gets the scale of the transform, relative to its parent.
   * @type {vec3}
   */
  public get localScale(): vec3 {
    return this._scale;
  }

  // --- World Space ---

  /**
   * Gets the absolute world-space position of the transform.
   * @type {vec3}
   */
  public get worldPosition(): vec3 {
    const out = vec3.create();
    mat4.getTranslation(out, this._modelMatrix);
    return out;
  }

  /**
   * Sets the absolute world-space position of the transform.
   * @param {vec3} newWorldPosition - The new position in world coordinates.
   */
  public set worldPosition(newWorldPosition: vec3) {
    if (this._parent) {
      const parentWorld = this._parent.modelMatrix;
      const invParentWorld = mat4.create();
      mat4.invert(invParentWorld, parentWorld);
      vec3.transformMat4(this._position, newWorldPosition, invParentWorld);
    } else {
      vec3.copy(this._position, newWorldPosition);
    }
    this._dirty = true;
  }

  /**
   * Gets the absolute world-space rotation of the transform as a quaternion.
   * @type {quat}
   */
  public get worldRotationQuat(): quat {
    const out = quat.create();
    mat4.getRotation(out, this._modelMatrix);
    return out;
  }

  /**
   * Sets the absolute world-space rotation of the transform using a quaternion.
   * @param {quat} newWorldRotation - The new rotation in world coordinates.
   */
  public set worldRotationQuat(newWorldRotation: quat) {
    if (this._parent) {
      const parentWorldRot = this._parent.worldRotationQuat;
      const invParentWorldRot = quat.create();
      quat.invert(invParentWorldRot, parentWorldRot);
      quat.multiply(this._rotation, invParentWorldRot, newWorldRotation);
    } else {
      quat.copy(this._rotation, newWorldRotation);
    }
    this.updateEulerFromQuat();
  }

  /**
   * Gets the absolute world-space rotation of the transform in Euler angles (degrees).
   * @type {vec3}
   */
  public get worldRotation(): vec3 {
    const euler = vec3.create();
    toEuler(euler, this.worldRotationQuat);
    vec3.scale(euler, euler, 180 / Math.PI);
    return euler;
  }

  /**
   * Sets the absolute world-space rotation of the transform using Euler angles (degrees).
   * @param {vec3} newWorldRotation - The new rotation in world coordinates.
   */
  public set worldRotation(newWorldRotation: vec3) {
    const q = quat.create();
    quat.fromEuler(q, newWorldRotation[0], newWorldRotation[1], newWorldRotation[2]);
    this.worldRotationQuat = q;
  }

  /**
   * Gets the absolute world-space scale of the transform.
   * Note: This can be affected by the scale of parent objects.
   * @type {vec3}
   */
  public get worldScale(): vec3 {
    const out = vec3.create();
    mat4.getScaling(out, this._modelMatrix);
    return out;
  }

  /**
   * Sets the absolute world-space scale of the transform.
   * @param {vec3} newWorldScale - The new scale in world coordinates.
   */
  public set worldScale(newWorldScale: vec3) {
    if (this._parent) {
      const parentWorldScale = this._parent.worldScale;
      this._scale[0] = newWorldScale[0] / parentWorldScale[0];
      this._scale[1] = newWorldScale[1] / parentWorldScale[1];
      this._scale[2] = newWorldScale[2] / parentWorldScale[2];
    } else {
      vec3.copy(this._scale, newWorldScale);
    }
    this._dirty = true;
  }

  /**
   * Gets the parent transform.
   * @type {Transform | null}
   */
  public get parent(): Transform | null {
    return this._parent;
  }

  /**
   * Sets the position of the transform relative to its parent.
   * @param {number} [x=0] - The x-coordinate.
   * @param {number} [y=0] - The y-coordinate.
   * @param {number} [z=0] - The z-coordinate.
   * @returns {void}
   */
  public setLocalPosition(x: number = 0, y: number = 0, z: number = 0): void {
    vec3.set(this.localPosition, x, y, z);
    this._dirty = true;
  }

  /**
   * Sets the rotation of the transform using Euler angles in degrees.
   * @param {number} [xDegrees=0] - The rotation around the x-axis in degrees.
   * @param {number} [yDegrees=0] - The rotation around the y-axis in degrees.
   * @param {number} [zDegrees=0] - The rotation around the z-axis in degrees.
   * @returns {void}
   */
  public setLocalRotation(xDegrees: number = 0, yDegrees: number = 0, zDegrees: number = 0): void {
    vec3.set(this.localRotation, xDegrees, yDegrees, zDegrees);
    quat.fromEuler(this.localRotationQuat, xDegrees, yDegrees, zDegrees);
    this._dirty = true;
  }

  /**
   * Sets the scale of the transform relative to its parent.
   * @param {number} [x=1] - The scale factor for the x-axis.
   * @param {number} [y=1] - The scale factor for the y-axis.
   * @param {number} [z=1] - The scale factor for the z-axis.
   * @returns {void}
   */
  public setLocalScale(x: number = 1, y: number = 1, z: number = 1): void {
    vec3.set(this.localScale, x, y, z);
    this._dirty = true;
  }

  /**
   * Sets the absolute world-space position of the transform.
   * @param {number} [x=0] - The x-coordinate in world space.
   * @param {number} [y=0] - The y-coordinate in world space.
   * @param {number} [z=0] - The z-coordinate in world space.
   * @returns {void}
   */
  public setWorldPosition(x: number = 0, y: number = 0, z: number = 0): void {
    this.worldPosition = vec3.fromValues(x, y, z);
  }

  /**
   * Sets the absolute world-space rotation of the transform using Euler angles (degrees).
   * @param {number} [xDegrees=0] - The rotation around the x-axis in degrees.
   * @param {number} [yDegrees=0] - The rotation around the y-axis in degrees.
   * @param {number} [zDegrees=0] - The rotation around the z-axis in degrees.
   * @returns {void}
   */
  public setWorldRotation(xDegrees: number = 0, yDegrees: number = 0, zDegrees: number = 0): void {
    this.worldRotation = vec3.fromValues(xDegrees, yDegrees, zDegrees);
  }

  /**
   * Sets the absolute world-space scale of the transform.
   * Note: This can behave unexpectedly if the parent has a non-uniform scale.
   * @param {number} [x=1] - The scale factor for the x-axis.
   * @param {number} [y=1] - The scale factor for the y-axis.
   * @param {number} [z=1] - The scale factor for the z-axis.
   * @returns {void}
   */
  public setWorldScale(x: number = 1, y: number = 1, z: number = 1): void {
    this.worldScale = vec3.fromValues(x, y, z);
  }

  /**
   * Translates the transform by a given vector.
   * @param {number} [x=0] - The x-component of the translation vector.
   * @param {number} [y=0] - The y-component of the translation vector.
   * @param {number} [z=0] - The z-component of the translation vector.
   * @returns {void}
   */
  public translate(x: number = 0, y: number = 0, z: number = 0): void {
    vec3.add(this.localPosition, this.localPosition, vec3.fromValues(x, y, z));
    this._dirty = true;
  }

  /**
   * Rotates the transform by a given amount of Euler angles in degrees.
   * @param {number} [xDegrees=0] - The rotation around the x-axis in degrees.
   * @param {number} [yDegrees=0] - The rotation around the y-axis in degrees.
   * @param {number} [zDegrees=0] - The rotation around the z-axis in degrees.
   * @returns {void}
   */
  public rotate(xDegrees: number = 0, yDegrees: number = 0, zDegrees: number = 0): void {
    vec3.add(this.localRotation, this.localRotation, vec3.fromValues(xDegrees, yDegrees, zDegrees));
    const rotationToAdd = quat.create();
    quat.fromEuler(rotationToAdd, xDegrees, yDegrees, zDegrees);
    quat.multiply(this._rotation, this._rotation, rotationToAdd);
    this._dirty = true;
  }

  /**
   * Scales the transform by a given amount.
   * @param {number} [x=1] - The scale factor for the x-axis.
   * @param {number} [y=1] - The scale factor for the y-axis.
   * @param {number} [z=1] - The scale factor for the z-axis.
   * @returns {void}
   */
  public scale(x: number = 1, y: number = 1, z: number = 1): void {
    vec3.multiply(this.localScale, this.localScale, vec3.fromValues(x, y, z));
    this._dirty = true;
  }

  /**
   * Updates the local and world matrices based on the current position, rotation, and scale.
   * This method is recursive and updates all child transforms.
   * @returns {void}
   */
  public updateMatrices(): void {
    if (this._dirty) {
      mat4.fromRotationTranslationScale(this._localMatrix, this._rotation, this.localPosition, this.localScale);
      if (this._parent) {
        mat4.multiply(this._modelMatrix, this._parent.modelMatrix, this._localMatrix);
      } else {
        mat4.copy(this._modelMatrix, this._localMatrix);
      }
    }
    for (const child of this._children) {
      child.setDirty(this._dirty);
      child.updateMatrices();
    }
    this._dirty = false;
  }

  /**
   * Sets the parent of the transform, managing the hierarchy.
   * @param {Transform | null} parent - The new parent transform, or null to remove the parent.
   * @returns {void}
   */
  public setParent(parent: Transform | null): void {
    if (this._parent) {
      const index = this._parent._children.indexOf(this);
      if (index > -1) {
        this._parent._children.splice(index, 1);
      }
    }
    this._parent = parent;
    if (this._parent) {
      this._parent._children.push(this);
    }
    this._dirty = true;
  }


  /**
   * Gets the right direction vector from the world matrix.
   * @type {vec3}
   */
  public get right(): vec3 {
    return vec3.fromValues(this._modelMatrix[0], this._modelMatrix[1], this._modelMatrix[2]);
  }
  /**
   * Gets the left direction vector from the world matrix.
   * @type {vec3}
   */
  public get left(): vec3 {
    return vec3.negate(vec3.create(), this.right);
  }
  /**
   * Gets the up direction vector from the world matrix.
   * @type {vec3}
   */
  public get up(): vec3 {
    return vec3.fromValues(this._modelMatrix[4], this._modelMatrix[5], this._modelMatrix[6]);
  }
  /**
   * Gets the down direction vector from the world matrix.
   * @type {vec3}
   */
  public get down(): vec3 {
    return vec3.negate(vec3.create(), this.up);
  }
  /**
   * Gets the forward direction vector from the world matrix.
   * @type {vec3}
   */
  public get forward(): vec3 {
    return vec3.fromValues(this._modelMatrix[8], this._modelMatrix[9], this._modelMatrix[10]);
  }
  /**
   * Gets the back direction vector from the world matrix.
   * @type {vec3}
   */
  public get back(): vec3 {
    return vec3.negate(vec3.create(), this.forward);
  }

  /**
   * Orients the transform to look at a specific target point in world space.
   * @param {vec3} target - The target position to look at.
   * @param {vec3} [worldUp] - An optional vector indicating the world's up direction.
   * @returns {void}
   */
  public lookAt(target: vec3, worldUp?: vec3): void {
    const tempViewMatrix = mat4.create();
    mat4.targetTo(tempViewMatrix, this.worldPosition, target, worldUp || vec3.fromValues(0, 1, 0));
    this.worldRotationQuat = mat4.getRotation(quat.create(), tempViewMatrix);
    /*
    const tempModelMatrix = mat4.create();
    mat4.invert(tempModelMatrix, tempViewMatrix);
    mat4.getRotation(this._rotation, tempModelMatrix);

    const flipQuat = quat.create();
    quat.fromEuler(flipQuat, 0, 180, 0);
    quat.multiply(this._rotation, this._rotation, flipQuat);

    const euler = vec3.create();
    toEuler(euler, this._rotation);
    vec3.scale(this._rotationInDegrees, euler, 180 / Math.PI);
    */
    this._dirty = true;
  }

  /**
   * Serializes the transform's state to a JSON object.
   * @override
   * @returns {JsonSerializedData} - The JSON object representation.
   */
  public override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      uuid: this.uuid,
      parent: this.parent?.uuid,
      position: [this.localPosition[0], this.localPosition[1], this.localPosition[2]],
      rotation: [this.localRotation[0], this.localRotation[1], this.localRotation[2]],
      scale: [this.localScale[0], this.localScale[1], this.localScale[2]],
    };
  }

  /**
   * Deserializes the transform's state from a JSON object.
   * @override
   * @param {JsonSerializedData} jsonObject - The JSON object to deserialize from.
   * @returns {void}
   */
  public override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.setLocalPosition(jsonObject['position'][0], jsonObject['position'][1], jsonObject['position'][2]);
    this.setLocalRotation(jsonObject['rotation'][0], jsonObject['rotation'][1], jsonObject['rotation'][2]);
    this.setLocalScale(jsonObject['scale'][0], jsonObject['scale'][1], jsonObject['scale'][2]);
    this._dirty = true;
  }

  /**
   * Rotates the transform by a given quaternion.
   * @param {quat} q - The quaternion to rotate by.
   * @returns {void}
   */
  public rotateByQuat(q: quat): void {
    quat.multiply(this.localRotationQuat, q, this.localRotationQuat);
    this.updateEulerFromQuat();
    this._dirty = true;
  }

  /**
   * Sets the dirty flag of the transform, forcing a matrix recalculation.
   * @param {boolean} dirty - The new state of the dirty flag.
   * @returns {void}
   */
  public setDirty(dirty: boolean): void {
    this._dirty = dirty;
  }

  /**
   * Sets the local rotation of the transform using a quaternion.
   * @param {quat} newRotation - The new rotation quaternion.
   * @returns {void}
   */
  public setLocalRotationQuat(newRotation: quat): void {
    quat.copy(this.localRotationQuat, newRotation);
    this.updateEulerFromQuat();
    this._dirty = true;
  }

  /**
   * Updates the internal Euler angle representation from the quaternion.
   * @private
   */
  private updateEulerFromQuat(): void {
    const euler = vec3.create();
    toEuler(euler, this.localRotationQuat);
    vec3.scale(this.localRotation, euler, 180 / Math.PI);
  }
}

// Legacy property names for backward compatibility
Object.defineProperty(Transform.prototype, "position", { get: function() { return this.localPosition; } });
Object.defineProperty(Transform.prototype, "rotation", { get: function() { return this.localRotation; } });
Object.defineProperty(Transform.prototype, "rotationQuat", { get: function() { return this.localRotationQuat; } });
