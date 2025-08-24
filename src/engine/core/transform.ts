import { JsonSerializable } from '@engine/interfaces/json-serializable';
import { JsonSerializedData } from '@engine/interfaces/json-serialized-data';
import { vec3, mat4, quat } from 'gl-matrix';
import { v4 as uuidv4 } from 'uuid';

/**
 * A helper function to convert a quaternion to Euler angles in radians,
 * compatible with older versions of gl-matrix.
 */
function toEuler(out: vec3, q: quat) {
  const x = q[0], y = q[1], z = q[2], w = q[3];
  const x2 = x * x, y2 = y * y, z2 = z * z;
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

export class Transform extends JsonSerializable {

  private _position!: vec3;
  private _rotationInDegrees!: vec3;
  private _rotation!: quat;
  private _scale!: vec3;

  private _modelMatrix!: mat4;
  private _localMatrix!: mat4;
  private _parent: Transform | null = null;
  private _children: Transform[] = [];
  private _uuid: string;
  private _dirty: boolean = true;

  constructor() {
    super();
    this._position = vec3.create();
    this._rotation = quat.create();
    this._rotationInDegrees = vec3.create();
    this._scale = vec3.fromValues(1, 1, 1);
    this._modelMatrix = mat4.create();
    this._localMatrix = mat4.create();
    this._uuid = uuidv4();
    this._dirty = true;
  }

  public get modelMatrix() { return this._modelMatrix; }
  public get position() { return this._position; }
  public get rotation() { return this._rotationInDegrees; }
  public get rotationInRadians() { return this._rotation; }
  public get localScale() { return this._scale; }
  public get parent() { return this._parent; }
  public get uuid() { return this._uuid; }

  public setPosition(x: number = 0, y: number = 0, z: number = 0) {
    vec3.set(this._position, x, y, z);
    this._dirty = true;
  }

  public setRotation(xDegrees: number = 0, yDegrees: number = 0, zDegrees: number = 0) {
    vec3.set(this._rotationInDegrees, xDegrees, yDegrees, zDegrees);
    quat.fromEuler(this._rotation, xDegrees, yDegrees, zDegrees);
    this._dirty = true;
  }

  public setScale(x: number = 1, y: number = 1, z: number = 1) {
    vec3.set(this._scale, x, y, z);
    this._dirty = true;
  }

  public translate(x: number = 0, y: number = 0, z: number = 0) {
    vec3.add(this._position, this._position, vec3.fromValues(x, y, z));
    this._dirty = true;
  }

  public rotate(xDegrees: number = 0, yDegrees: number = 0, zDegrees: number = 0) {
    vec3.add(this._rotationInDegrees, this._rotationInDegrees, vec3.fromValues(xDegrees, yDegrees, zDegrees));
    const rotationToAdd = quat.create();
    quat.fromEuler(rotationToAdd, xDegrees, yDegrees, zDegrees);
    quat.multiply(this._rotation, this._rotation, rotationToAdd);
    this._dirty = true;
  }

  public scale(x: number = 1, y: number = 1, z: number = 1) {
    vec3.multiply(this._scale, this._scale, vec3.fromValues(x, y, z));
    this._dirty = true;
  }

  public updateMatrices() {
    if (this._dirty) {
      mat4.fromRotationTranslationScale(this._localMatrix, this._rotation, this._position, this._scale);
      if (this._parent) {
        mat4.multiply(this._modelMatrix, this._parent.modelMatrix, this._localMatrix);
      } else {
        mat4.copy(this._modelMatrix, this._localMatrix);
      }
      this._dirty = false;
    }
    for (const child of this._children) {
      child.updateMatrices();
    }
  }

  public setParent(parent: Transform | null) {
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

  public get right(): vec3 { return vec3.fromValues(this._modelMatrix[0], this._modelMatrix[1], this._modelMatrix[2]); }
  public get left(): vec3 { return vec3.negate(vec3.create(), this.right); }
  public get up(): vec3 { return vec3.fromValues(this._modelMatrix[4], this._modelMatrix[5], this._modelMatrix[6]); }
  public get down(): vec3 { return vec3.negate(vec3.create(), this.up); }
  public get forward(): vec3 { return vec3.fromValues(this._modelMatrix[8], this._modelMatrix[9], this._modelMatrix[10]); }
  public get back(): vec3 { return vec3.negate(vec3.create(), this.forward); }

  public lookAt(target: vec3, worldUp?: vec3): void {
    const defaultWorldUp = vec3.fromValues(0, 1, 0);
    const effectiveUp = worldUp || defaultWorldUp;
    const tempViewMatrix = mat4.create();
    mat4.lookAt(tempViewMatrix, this._position, target, effectiveUp);
    const tempModelMatrix = mat4.create();
    mat4.invert(tempModelMatrix, tempViewMatrix);
    mat4.getRotation(this._rotation, tempModelMatrix);

    // Apply an additional 180-degree rotation to orient the object
    // from -Z forward to +Z forward.
    const flipQuat = quat.create();
    quat.fromEuler(flipQuat, 0, 180, 0);
    quat.multiply(this._rotation, this._rotation, flipQuat);

    const euler = vec3.create();
    toEuler(euler, this._rotation);
    vec3.scale(this._rotationInDegrees, euler, 180 / Math.PI);
    this._dirty = true;
  }

  public override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      uuid: this.uuid,
      parent: this.parent?.uuid,
      position: [this._position[0], this._position[1], this._position[2]],
      rotation: [this._rotationInDegrees[0], this._rotationInDegrees[1], this._rotationInDegrees[2]],
      scale: [this._scale[0], this._scale[1], this._scale[2]],
    };
  }

  public override fromJson(jsonObject: JsonSerializedData): void {
    this._uuid = jsonObject['uuid'];
    this.setPosition(jsonObject['position'][0], jsonObject['position'][1], jsonObject['position'][2]);
    this.setRotation(jsonObject['rotation'][0], jsonObject['rotation'][1], jsonObject['rotation'][2]);
    this.setScale(jsonObject['scale'][0], jsonObject['scale'][1], jsonObject['scale'][2]);
    this._dirty = true;
  }

  public rotateByQuat(q: quat) {
    quat.multiply(this._rotation, q, this._rotation);
    const euler = vec3.create();
    toEuler(euler, this._rotation);
    vec3.scale(this._rotationInDegrees, euler, 180 / Math.PI);
    this._dirty = true;
  }

  public setDirty(dirty: boolean) {
    this._dirty = dirty;
  }

  // Provides a copy of the internal rotation quaternion
  public get rotationQuat(): quat {
    return quat.clone(this._rotation);
  }

  // Sets the internal rotation quaternion and updates Euler angles and dirty flag
  public setRotationQuat(newRotation: quat): void {
    quat.copy(this._rotation, newRotation);
    const euler = vec3.create();
    // Assuming 'toEuler' is the helper function you have
    toEuler(euler, this._rotation);
    vec3.scale(this._rotationInDegrees, euler, 180 / Math.PI);
    this._dirty = true;
  }
}
