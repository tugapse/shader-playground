import { Vector3 } from "omega-game-engine/dist/core/vector";
import {
  RigidbodyComponent,
  ColliderComponent,
  RigidbodyType,
  ColliderShape,
} from "./components";
import { PhysicsWorld } from "./world";

export class PhysicsBehavior {
  public rigidbody: RigidbodyComponent;
  public collider: ColliderComponent | undefined;

  private physicsWorld: PhysicsWorld;

  constructor(physicsWorld: PhysicsWorld) {
    this.physicsWorld = physicsWorld;

    // Initialize default data containers
    this.rigidbody = new RigidbodyComponent();
  }

  /**
   * Quick configuration helpers for user scripts or editor forms
   */
  public makeDynamic(mass: number = 1.0): this {
    this.rigidbody.type = RigidbodyType.Dynamic;
    this.rigidbody.mass = mass;
    return this;
  }

  public makeStatic(): this {
    this.rigidbody.type = RigidbodyType.Static;
    this.rigidbody.mass = 0;
    return this;
  }

  public addBoxCollider(width: number, height: number, depth: number): this {
    this.collider = new ColliderComponent();
    this.collider.shape = ColliderShape.Box;
    // Cannon uses half-extents, pass half size
    this.collider.size = new Vector3(width / 2, height / 2, depth / 2);
    return this;
  }

  /**
   * Registers this entity into the active simulation world
   */
  public enableSimulation(): void {
    // this.physicsWorld.registerEntity(
    //   this.entityId,
    //   this.rigidbody,
    //   this.collider,
    //   currentTransform,
    // );
  }

  /**
   * Runtime physics controls exposed to your engine's scripting environment
   */
  public applyForce(force: Vector3): void {
    const rawBody = this.rigidbody.internalBodyRef;
    if (rawBody) {
      // Direct pass-through to the underlying active engine body reference
      rawBody.applyForce(force);
    }
  }

  public setLinearVelocity(velocity: Vector3): void {
    const rawBody = this.rigidbody.internalBodyRef;
    if (rawBody) {
      rawBody.velocity.set(velocity.x, velocity.y, velocity.z);
    }
  }
}
