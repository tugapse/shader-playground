import { EntityBehaviour } from "../behaviours/entity-behaviour";

/**
  An interface for behaviours that require pre and post-update and draw hooks.
   {EntityBehaviour}
 */
export interface SceneEntityBehaviour extends EntityBehaviour {
  /**
    A lifecycle method called before the main update loop.
   * @param {number} ellapsed - The time elapsed since the last frame in milliseconds.
   * @returns {void}
   */
  beforeUpdate(ellapsed: number): void;

  /**
    A lifecycle method called after the main update loop.
   * @returns {void}
   */
  afterUpdate(): void;

  /**
    A lifecycle method called before the main draw call.
   * @returns {void}
   */
  beforeDraw(): void;

  /**
    A lifecycle method called after the main draw call.
   * @returns {void}
   */
  afterDraw(): void;
}