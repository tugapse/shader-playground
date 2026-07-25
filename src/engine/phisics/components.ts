import { quat } from "gl-matrix";
import { Vector3 } from "omega-game-engine";

export enum RigidbodyType {
  Static,
  Dynamic,
  Kinematic,
}

export enum ColliderShape {
  Box,
  Sphere,
  Capsule,
  Plane,
  Mesh,
}

export interface PhysicsWorldSettings {
  gravity: Vector3;
  timeStep: number;
}

export class RigidbodyComponent {
  public type: RigidbodyType = RigidbodyType.Dynamic;
  public mass: number = 1.0;
  public linearDamping: number = 0.0;
  public angularDamping: number = 0.0;

  // Storage for backend specific references if needed later
  public internalBodyRef: any = null;
}

export class ColliderComponent {
  public shape: ColliderShape = ColliderShape.Box;
  public size: Vector3 = new Vector3(1, 1, 1);
  public isTrigger: boolean = false;
  public friction: number = 0.5;
  public restitution: number = 0.0;

  public customVertices?: number[];
  public customIndices?: number[];
}

export interface PhysicsTransform {
  position: Vector3;
  rotation: quat;
  isDirty?: boolean;
}
