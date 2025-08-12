import { vec3, mat4 } from 'gl-matrix'

export class Transform {

  private _position!: vec3;
  private _rotation!: vec3;
  private _scale!: vec3;

  private _modelMatrix!: mat4;
  public get modelMatrix() { return this._modelMatrix }
  public get position() { return this._position}
  public get rotation() { return this._rotation }
  public get localScale() { return this._scale}

  constructor() {
    this._position = [0, 0, 0];
    this._rotation = [0, 0, 0];
    this._scale = [1, 1, 1];
    this._modelMatrix = mat4.create();
    this.updateModelMatrix();
  }

  public translate(x: number = 0, y: number = 0, z: number = 0) {
    this._position = [x, y, z]
    this.updateModelMatrix();
  }

  public rotate(x: number = 0, y: number = 0, z: number = 0) {
    this._rotation = [x, y, z]
    this.updateModelMatrix();
  }

  public scale(x: number = 0, y: number = 0, z: number = 0) {
    this._scale = [x, y, z]
    this.updateModelMatrix();
  }


  public updateModelMatrix() {
    mat4.identity(this._modelMatrix);
    // mat4.rotate(this._modelMatrix, this._modelMatrix, this._rotation[0], [1, 0, 0]);
    // mat4.rotate(this._modelMatrix, this._modelMatrix, this._rotation[1], [0, 1, 0]);
    // mat4.rotate(this._modelMatrix, this._modelMatrix, this._rotation[2], [0, 0, 1]);
    mat4.translate(this._modelMatrix, this._modelMatrix, this._position);
    mat4.scale(this._modelMatrix, this._modelMatrix, this._scale);
  }

}
