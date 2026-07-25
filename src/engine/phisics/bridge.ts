import { Vector3 } from "omega-game-engine";
import {
  PhysicsWorldSettings,
  RigidbodyComponent,
  ColliderComponent,
  PhysicsTransform,
} from "./components";

export abstract class PhysicsEngineBridge {
  /** Lifecycle hooks */
  public abstract initialize(settings: PhysicsWorldSettings): Promise<void>;
  public abstract step(dt: number): void;
  public abstract destroy(): void;

  /** Entity mapping operations */
  public abstract registerEntity(
    entityId: string,
    rb: RigidbodyComponent,
    col?: ColliderComponent,
    transform?: PhysicsTransform,
  ): void;
  public abstract unregisterEntity(entityId: string): void;

  /** System updates from engine to simulation */
  public abstract syncToPhysics(
    entityId: string,
    transform: PhysicsTransform,
  ): void;

  /** Read results out of simulation */
  public abstract getTransformFromPhysics(
    entityId: string,
  ): PhysicsTransform | null;

  /** Global environment modifiers */
  public abstract setGravity(x: number, y: number, z: number): void;

  /** Raycasting */
  public abstract raycast(
    origin: Vector3,
    direction: Vector3,
    maxDistance: number,
  ): {
    hit: boolean;
    entityId: string | null;
    distance: number;
    normal: Vector3;
  } | null;
}
