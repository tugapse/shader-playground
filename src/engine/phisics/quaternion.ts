import { quat, mat3 } from "gl-matrix";
import {
  JsonSerializable,
  JsonSerializedData,
  Vector3,
} from "omega-game-engine";

export class Quaternion extends JsonSerializable {
  protected _quaternion: quat;

  constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
    super("Quaternion");
    this._quaternion = quat.fromValues(x, y, z, w);
  }

  public get internalQuat(): quat {
    return this._quaternion;
  }

  // Getters and Setters
  public get x(): number {
    return this._quaternion[0];
  }
  public set x(value: number) {
    this._quaternion[0] = value;
  }

  public get y(): number {
    return this._quaternion[1];
  }
  public set y(value: number) {
    this._quaternion[1] = value;
  }

  public get z(): number {
    return this._quaternion[2];
  }
  public set z(value: number) {
    this._quaternion[2] = value;
  }

  public get w(): number {
    return this._quaternion[3];
  }
  public set w(value: number) {
    this._quaternion[3] = value;
  }

  // Static initializers
  public static Instanciate(): Quaternion {
    return new Quaternion();
  }

  public static fromAxisAngle(axis: Vector3, angle: number): Quaternion {
    const newQuat = new Quaternion();
    quat.setAxisAngle(newQuat._quaternion, axis.vector, angle);
    return newQuat;
  }

  public static fromEuler(x: number, y: number, z: number): Quaternion {
    const newQuat = new Quaternion();
    quat.fromEuler(newQuat._quaternion, x, y, z);
    return newQuat;
  }

  public static fromMat3(m: mat3): Quaternion {
    const newQuat = new Quaternion();
    quat.fromMat3(newQuat._quaternion, m);
    return newQuat;
  }

  // Instance methods
  public identity(): this {
    quat.identity(this._quaternion);
    return this;
  }

  public set(x: number, y: number, z: number, w: number): this {
    quat.set(this._quaternion, x, y, z, w);
    return this;
  }

  public copy(q: Quaternion): this {
    quat.copy(this._quaternion, q._quaternion);
    return this;
  }

  public clone(): Quaternion {
    const newQuat = new Quaternion();
    quat.copy(newQuat._quaternion, this._quaternion);
    return newQuat;
  }

  public setAxisAngle(axis: Vector3, angle: number): this {
    quat.setAxisAngle(this._quaternion, axis.vector, angle);
    return this;
  }

  public getAxisAngle(axis: Vector3): number {
    return quat.getAxisAngle(axis.vector, this._quaternion);
  }

  public add(q: Quaternion): this {
    quat.add(this._quaternion, this._quaternion, q._quaternion);
    return this;
  }

  public multiply(q: Quaternion): this {
    quat.multiply(this._quaternion, this._quaternion, q._quaternion);
    return this;
  }

  public scale(s: number): this {
    quat.scale(this._quaternion, this._quaternion, s);
    return this;
  }

  public dot(q: Quaternion): number {
    return quat.dot(this._quaternion, q._quaternion);
  }

  public lerp(to: Quaternion, t: number): this {
    quat.lerp(this._quaternion, this._quaternion, to._quaternion, t);
    return this;
  }

  public slerp(to: Quaternion, t: number): this {
    quat.slerp(this._quaternion, this._quaternion, to._quaternion, t);
    return this;
  }

  public invert(): this {
    quat.invert(this._quaternion, this._quaternion);
    return this;
  }

  public conjugate(): this {
    quat.conjugate(this._quaternion, this._quaternion);
    return this;
  }

  public length(): number {
    return quat.length(this._quaternion);
  }

  public squaredLength(): number {
    return quat.squaredLength(this._quaternion);
  }

  public normalize(): this {
    quat.normalize(this._quaternion, this._quaternion);
    return this;
  }

  public rotateX(rad: number): this {
    quat.rotateX(this._quaternion, this._quaternion, rad);
    return this;
  }

  public rotateY(rad: number): this {
    quat.rotateY(this._quaternion, this._quaternion, rad);
    return this;
  }

  public rotateZ(rad: number): this {
    quat.rotateZ(this._quaternion, this._quaternion, rad);
    return this;
  }

  public fromEuler(x: number, y: number, z: number): this {
    quat.fromEuler(this._quaternion, x, y, z);
    return this;
  }

  public override toString(): string {
    return `Quaternion(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
  }

  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject);
    this.deserializeAutomatically(jsonObject);
  }

  override toJsonObject(): JsonSerializedData {
    return this.serializeAutomatically();
  }
}
