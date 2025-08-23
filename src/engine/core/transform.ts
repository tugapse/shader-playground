import { JsonSerializable } from '@engine/interfaces/json-serializable';
import { JsonSerializedData } from '@engine/interfaces/json-serialized-data';
import { vec3, mat4, quat } from 'gl-matrix';
import { v4 as uuidv4 } from 'uuid';

export class Transform extends JsonSerializable {

  private _position!: vec3;
  private _rotation!: quat;
  private _scale!: vec3;

  private _modelMatrix!: mat4;
  private _localMatrix!: mat4;
  private _parent: Transform | null = null;
  private _children: Transform[] = [];
  private _uuid: string;

  // Getters
  public get modelMatrix() { return this._modelMatrix; }
  public get position() { return this._position; }
  public get rotation() { return this._rotation; }
  public get localScale() { return this._scale; }
  public get parent() { return this._parent; }
  public get uuid() { return this._uuid; }

  constructor() {
    super();
    this._position = vec3.create();
    this._rotation = quat.create();
    this._scale = vec3.fromValues(1, 1, 1);
    this._modelMatrix = mat4.create();
    this._localMatrix = mat4.create();
    this.updateMatrices();
    this._uuid = uuidv4();
  }

  public setParent(parent: Transform | null) {
    if (this._parent) {
      const index = this._parent._children.indexOf(this);
      if (index > -1) {
        this._parent._children.splice(index, 1);
      }
    }

    this._parent = parent;

    // Add to new parent's children list
    if (this._parent) {
      this._parent._children.push(this);
    }

    this.updateMatrices();
  }

  public setPosition(x: number = 0, y: number = 0, z: number = 0) {
    vec3.set(this._position, x, y, z);
    this.updateMatrices();
  }

  public setRotation(xRadians: number = 0, yRadians: number = 0, zRadians: number = 0) {
    quat.fromEuler(this._rotation, xRadians * 180 / Math.PI, yRadians * 180 / Math.PI, zRadians * 180 / Math.PI);
    this.updateMatrices();
  }

  public setScale(x: number = 1, y: number = 1, z: number = 1) {
    vec3.set(this._scale, x, y, z);
    this.updateMatrices();
  }

  public translate(x: number = 0, y: number = 0, z: number = 0) {
    vec3.add(this._position, this._position, vec3.fromValues(x, y, z));
    this.updateMatrices();
  }

  public rotate(xRadians: number = 0, yRadians: number = 0, zRadians: number = 0) {
    const rotX = quat.setAxisAngle(quat.create(), [1, 0, 0], xRadians);
    const rotY = quat.setAxisAngle(quat.create(), [0, 1, 0], yRadians);
    const rotZ = quat.setAxisAngle(quat.create(), [0, 0, 1], zRadians);

    quat.multiply(this._rotation, this._rotation, rotX);
    quat.multiply(this._rotation, this._rotation, rotY);
    quat.multiply(this._rotation, this._rotation, rotZ);

    this.updateMatrices();
  }

  public scale(x: number = 1, y: number = 1, z: number = 1) {
    vec3.multiply(this._scale, this._scale, vec3.fromValues(x, y, z));
    this.updateMatrices();
  }

  /**
   * Updates both the local and world-space model matrices, and recursively updates children.
   */
  public updateMatrices() {
    // 1. Compute the local matrix from position, rotation, and scale
    mat4.fromRotationTranslationScale(this._localMatrix, this._rotation, this._position, this._scale);

    // 2. Compute the world-space model matrix
    if (this._parent) {
      // If a parent exists, the world matrix is the parent's world matrix multiplied by our local matrix.
      mat4.multiply(this._modelMatrix, this._parent.modelMatrix, this._localMatrix);
    } else {
      // If no parent exists, our local matrix is the world matrix.
      mat4.copy(this._modelMatrix, this._localMatrix);
    }

    // 3. Recursively update all children
    for (const child of this._children) {
      child.updateMatrices();
    }
  }

  public get right(): vec3 {
    return vec3.fromValues(this._modelMatrix[0], this._modelMatrix[1], this._modelMatrix[2]);
  }

  public get left(): vec3 {
    return vec3.negate(vec3.create(), this.right);
  }

  public get up(): vec3 {
    return vec3.fromValues(this._modelMatrix[4], this._modelMatrix[5], this._modelMatrix[6]);
  }

  public get down(): vec3 {
    return vec3.negate(vec3.create(), this.up);
  }

  public get forward(): vec3 {
    return vec3.fromValues(this._modelMatrix[8], this._modelMatrix[9], this._modelMatrix[10]);
  }

  public get back(): vec3 {
    return vec3.negate(vec3.create(), this.forward);
  }

  public lookAt(target: vec3, worldUp?: vec3): void {
    const defaultWorldUp = vec3.fromValues(0, 1, 0);
    const effectiveUp = worldUp || defaultWorldUp;

    const tempViewMatrix = mat4.create();
    mat4.lookAt(tempViewMatrix, target, this._position, effectiveUp);

    const tempModelMatrix = mat4.create();
    mat4.invert(tempModelMatrix, tempViewMatrix);

    mat4.getRotation(this._rotation, tempModelMatrix);

    this.updateMatrices();
  }

  public override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      uuid: this.uuid,
      parent: this.parent?.uuid,
      position: [this._position[0], this._position[1], this._position[2]],
      rotation: [this._rotation[0], this._rotation[1], this._rotation[2], this._rotation[3]],
      scale: [this._scale[0], this._scale[1], this._scale[2]],
    }
  }

  public override fromJson(jsonObject: JsonSerializedData): void {
    this._uuid = jsonObject['uuid'];
    this.setPosition(jsonObject['position'][0], jsonObject['position'][1], jsonObject['position'][2]);
    quat.set(this._rotation, jsonObject['rotation'][0], jsonObject['rotation'][1], jsonObject['rotation'][2], jsonObject['rotation'][3]);
    this.setScale(jsonObject['scale'][0], jsonObject['scale'][1], jsonObject['scale'][2]);
    this.updateMatrices();
  }


}
