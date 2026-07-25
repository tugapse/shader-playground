import * as CANNON from "cannon-es";
import { PhysicsEngineBridge } from "../bridge";
import {
  ColliderComponent,
  ColliderShape,
  PhysicsTransform,
  PhysicsWorldSettings,
  RigidbodyComponent,
  RigidbodyType,
} from "../components";
import { Vector3 } from "omega-game-engine";

export class CannonPhysicsBridge extends PhysicsEngineBridge {
  private world!: CANNON.World;
  private bodyMap = new Map<string, CANNON.Body>();

  public async initialize(settings: PhysicsWorldSettings): Promise<void> {
    // Cannon matches perfectly instantly, no awaiting WASM binaries required!
    this.world = new CANNON.World();

    this.world.gravity.set(
      settings.gravity.x,
      settings.gravity.y,
      settings.gravity.z,
    );
  }

  public registerEntity(
    entityId: string,
    rb: RigidbodyComponent,
    col?: ColliderComponent,
    transform?: PhysicsTransform,
  ): void {
    let type: CANNON.BodyType;

    if (rb.type === RigidbodyType.Static) {
      type = CANNON.Body.STATIC;
    } else if (rb.type === RigidbodyType.Kinematic) {
      type = CANNON.Body.KINEMATIC;
    } else {
      type = CANNON.Body.DYNAMIC;
    }

    const body = new CANNON.Body({
      mass: rb.type === RigidbodyType.Static ? 0 : rb.mass,
      type: type,
      linearDamping: rb.linearDamping,
      angularDamping: rb.angularDamping,
    });

    if (transform) {
      body.position.set(
        transform.position.x,
        transform.position.y,
        transform.position.z,
      );
      body.quaternion.set(
        transform.rotation[0],
        transform.rotation[1],
        transform.rotation[2],
        transform.rotation[3],
      );
    }

    if (col) {
      let shape: CANNON.Shape;

      switch (col.shape) {
        case ColliderShape.Sphere:
          shape = new CANNON.Sphere(col.size.x);
          break;
        case ColliderShape.Capsule:
          shape = new CANNON.Cylinder(col.size.x, col.size.x, col.size.y, 8);
          break;
        case ColliderShape.Plane:
          shape = new CANNON.Plane();
          // Cannon planes face Z-up by default. Rotate it -90 degrees around X-axis to make it Y-up (standard floor)
          body.addShape(shape);
          body.quaternion.setFromAxisAngle(
            new CANNON.Vec3(1, 0, 0),
            -Math.PI / 2,
          );
          break;
        case ColliderShape.Mesh:
          if (!col.customVertices || !col.customIndices) {
            console.warn(
              `Mesh collider requested for entity ${entityId} but no vertex/index data was provided. Falling back to Box.`,
            );
            shape = new CANNON.Box(
              new CANNON.Vec3(col.size.x, col.size.y, col.size.z),
            );
          } else {
            // Create a Cannon Trimesh using the raw vertex and index configurations
            shape = new CANNON.Trimesh(col.customVertices, col.customIndices);
          }
          break;
        case ColliderShape.Box:
        default:
          shape = new CANNON.Box(
            new CANNON.Vec3(col.size.x, col.size.y, col.size.z),
          );
          break;
      }

      // Only attach the shape if it wasn't already attached directly (like the Plane exception)
      if (col.shape !== ColliderShape.Plane) {
        body.addShape(shape);
      }
      // Material properties for friction/restitution
      body.material = new CANNON.Material({
        friction: col.friction,
        restitution: col.restitution,
      });

      body.isTrigger = col.isTrigger;
      body.addShape(shape);
    }

    this.world.addBody(body);
    rb.internalBodyRef = body;
    this.bodyMap.set(entityId, body);
  }

  public unregisterEntity(entityId: string): void {
    const body = this.bodyMap.get(entityId);
    if (body) {
      this.world.removeBody(body);
      this.bodyMap.delete(entityId);
    }
  }

  public syncToPhysics(entityId: string, transform: PhysicsTransform): void {
    const body = this.bodyMap.get(entityId);
    if (body) {
      body.position.set(
        transform.position.x,
        transform.position.y,
        transform.position.z,
      );
      body.quaternion.set(
        transform.rotation[0],
        transform.rotation[1],
        transform.rotation[2],
        transform.rotation[3],
      );

      // Reset velocity forces during editor movements to prevent residual drift
      body.velocity.set(0, 0, 0);
      body.angularVelocity.set(0, 0, 0);
    }
  }

  public step(dt: number): void {
    // Standard fixed step simulation update execution
    this.world.step(dt);
  }

  public setGravity(x: number, y: number, z: number): void {
    this.world.gravity.set(x, y, z);
  }

  public raycast(origin: Vector3, direction: Vector3, maxDistance: number) {
    const from = new CANNON.Vec3(origin.x, origin.y, origin.z);

    // Calculate destination: from + (direction * maxDistance)
    const to = new CANNON.Vec3(
      origin.x + direction.x * maxDistance,
      origin.y + direction.y * maxDistance,
      origin.z + direction.z * maxDistance,
    );

    const result = new CANNON.RaycastResult();
    this.world.raycastClosest(from, to, {}, result);

    if (result.hasHit && result.body) {
      // Find the entity ID bound to this body reference context
      let foundId: string | null = null;
      for (const [id, b] of this.bodyMap.entries()) {
        if (b === result.body) {
          foundId = id;
          break;
        }
      }

      return {
        hit: true,
        entityId: foundId,
        distance: result.distance,
        normal: {
          x: result.hitNormalWorld.x,
          y: result.hitNormalWorld.y,
          z: result.hitNormalWorld.z,
        },
      };
    }
    return null;
  }

  public destroy(): void {
    // Clean out array allocations
    for (const body of this.bodyMap.values()) {
      this.world.removeBody(body);
    }
    this.bodyMap.clear();
  }
}
