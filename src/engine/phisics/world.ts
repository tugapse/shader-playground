import { PhysicsEngineBridge } from "./bridge";
import {
  PhysicsWorldSettings,
  RigidbodyComponent,
  ColliderComponent,
} from "./components";

export class PhysicsWorld {
  private activeBridge: PhysicsEngineBridge | null = null;
  // Keeps track of which entities are currently registered in the simulation
  private registeredEntities = new Set<string>();

  constructor() {}

  /**
   * Sets up the active engine backend bridge (e.g. your 3D or 2D implementation)
   */
  public async initialize(
    bridge: PhysicsEngineBridge,
    settings: PhysicsWorldSettings,
  ): Promise<void> {
    this.activeBridge = bridge;
    await this.activeBridge.initialize(settings);
    console.log("PhysicsWorld successfully initialized with backend bridge.");
  }

  /**
   * Registers or updates an entity within the physics simulation space.
   */
  public registerEntity(
    entityId: string,
    rb: RigidbodyComponent,
    col?: ColliderComponent,
    transform?: any,
  ): void {
    if (!this.activeBridge) return;

    this.activeBridge.registerEntity(entityId, rb, col, transform);
    this.registeredEntities.add(entityId);
  }

  /**
   * Removes an entity completely from the physics simulation loop.
   */
  public unregisterEntity(entityId: string): void {
    if (!this.activeBridge) return;

    if (this.registeredEntities.has(entityId)) {
      this.activeBridge.unregisterEntity(entityId);
      this.registeredEntities.delete(entityId);
    }
  }

  /**
   * The main update ticker. Call this alongside your engine game loop step.
   */
  public update(
    dt: number,
    getEntityTransform: (id: string) => any,
    updateEntityTransform: (id: string, pos: any, rot: any) => void,
  ): void {
    if (!this.activeBridge) return;

    // 1. Sync modifications made via Editor / Scripts TO the physics engine
    for (const entityId of this.registeredEntities) {
      const currentTransform = getEntityTransform(entityId);
      if (currentTransform && currentTransform.isDirty) {
        // Teleport/Sync the body if changed outside of physics (like dragging in Angular inspector)
        this.activeBridge.syncToPhysics(entityId, currentTransform);
        currentTransform.isDirty = false;
      }
    }

    // 2. Step the simulation forward
    this.activeBridge.step(dt);

    // 3. Sync simulation changes BACK to your visual engine entities
    for (const entityId of this.registeredEntities) {
      const rbData = this.activeBridge.getTransformFromPhysics(entityId);
      if (rbData) {
        updateEntityTransform(entityId, rbData.position, rbData.rotation);
      }
    }
  }

  /**
   * Global configuration updates on the fly
   */
  public setGravity(x: number, y: number, z: number): void {
    this.activeBridge?.setGravity(x, y, z);
  }

  /**
   * Completely destroys the simulation and cleans up references
   */
  public destroy(): void {
    if (this.activeBridge) {
      this.activeBridge.destroy();
      this.activeBridge = null;
    }
    this.registeredEntities.clear();
  }
}
