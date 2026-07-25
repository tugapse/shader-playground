// import RAPIER from "@dimforge/rapier3d";
// import { PhysicsEngineBridge } from "../bridge";
// import {
//   PhysicsWorldSettings,
//   RigidbodyComponent,
//   ColliderComponent,
//   PhysicsTransform,
//   RigidbodyType,
//   ColliderShape,
//   Vector3D,
// } from "../components";

// export class RapierPhysicsBridge extends PhysicsEngineBridge {
//   private world!: RAPIER.World;

//   // Maps your engine's string entity IDs to Rapier's native body handles
//   private bodyMap = new Map<string, RAPIER.RigidBody>();

//   public async initialize(settings: PhysicsWorldSettings): Promise<void> {
//     // 1. Await the underlying WebAssembly binary loading phase
//     await RAPIER.init();

//     // 2. Instantiate the physical universe tracking gravity vectors
//     const gravity = new RAPIER.Vector3(
//       settings.gravity.x,
//       settings.gravity.y,
//       settings.gravity.z,
//     );
//     this.world = new RAPIER.World(gravity);
//   }

//   public registerEntity(
//     entityId: string,
//     rb: RigidbodyComponent,
//     col?: ColliderComponent,
//     transform?: PhysicsTransform,
//   ): void {
//     let bodyDesc: RAPIER.RigidBodyDesc;

//     // Map structural engine types directly into Rapier descriptions
//     if (rb.type === RigidbodyType.Static) {
//       bodyDesc = RAPIER.RigidBodyDesc.fixed();
//     } else if (rb.type === RigidbodyType.Kinematic) {
//       bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
//     } else {
//       bodyDesc = RAPIER.RigidBodyDesc.dynamic();
//     }

//     // Set initial spatial positioning values safely
//     if (transform) {
//       bodyDesc.setTranslation(
//         transform.position.x,
//         transform.position.y,
//         transform.position.z,
//       );
//       bodyDesc.setRotation(transform.rotation);
//     }

//     bodyDesc.setLinearDamping(rb.linearDamping);
//     bodyDesc.setAngularDamping(rb.angularDamping);

//     const body = this.world.createRigidBody(bodyDesc);
//     rb.internalBodyRef = body;
//     this.bodyMap.set(entityId, body);

//     // If collider properties exist, create it immediately
//     if (col) {
//       let colliderDesc: RAPIER.ColliderDesc;

//       switch (col.shape) {
//         case ColliderShape.Sphere:
//           colliderDesc = RAPIER.ColliderDesc.ball(col.size.x); // x acts as radius configuration
//           break;
//         case ColliderShape.Capsule:
//           colliderDesc = RAPIER.ColliderDesc.capsule(col.size.x, col.size.y); // radius, half-height
//           break;
//         case ColliderShape.Box:
//         default:
//           colliderDesc = RAPIER.ColliderDesc.cuboid(
//             col.size.x,
//             col.size.y,
//             col.size.z,
//           );
//           break;
//       }

//       colliderDesc.setSensor(col.isTrigger);
//       colliderDesc.setFriction(col.friction);
//       colliderDesc.setRestitution(col.restitution);

//       this.world.createCollider(colliderDesc, body);
//     }
//   }

//   public unregisterEntity(entityId: string): void {
//     const body = this.bodyMap.get(entityId);
//     if (body) {
//       this.world.removeRigidBody(body);
//       this.bodyMap.delete(entityId);
//     }
//   }

//   public syncToPhysics(entityId: string, transform: PhysicsTransform): void {
//     const body = this.bodyMap.get(entityId);
//     if (body) {
//       // Forcefully update positions when editor transforms snap items across coordinates
//       body.setTranslation(transform.position, true);
//       body.setRotation(transform.rotation, true);
//     }
//   }

//   public getTransformFromPhysics(entityId: string): PhysicsTransform | null {
//     const body = this.bodyMap.get(entityId);
//     if (!body) return null;

//     const translation = body.translation();
//     const rotation = body.rotation();

//     return {
//       position: { x: translation.x, y: translation.y, z: translation.z },
//       rotation: { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w },
//     };
//   }

//   public step(dt: number): void {
//     // Advances internal calculations frame by frame
//     this.world.timestep = dt;
//     this.world.step();
//   }

//   public setGravity(x: number, y: number, z: number): void {
//     this.world.gravity = new RAPIER.Vector3(x, y, z);
//   }

//   public raycast(origin: Vector3D, direction: Vector3D, maxDistance: number) {
//     const ray = new RAPIER.Ray(origin, direction);
//     // 0xffffffff is a blanket collision bit-mask layout pattern to match everything
//     const hit = this.world.castRay(
//       ray,
//       maxDistance,
//       true,
//       undefined,
//       undefined,
//       undefined,
//       undefined,
//     );

//     if (hit) {
//       const hitPoint = ray.pointAt(hit.toi);
//       return {
//         hit: true,
//         entityId: null, // Rapier can fetch this back if mapped to user data handles
//         distance: hit.toi,
//         normal: { x: 0, y: 1, z: 0 },
//       };
//     }
//     return null;
//   }

//   public dispose(): void {
//     this.bodyMap.clear();
//     // Explicitly wipe the JS references to free the internal WebAssembly heap memory footprint
//     this.world.free();
//   }
// }
