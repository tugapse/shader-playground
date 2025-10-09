import { quat, vec3 } from 'gl-matrix';
import { Keybord, Mouse } from "../core/input";
import { EntityBehaviour } from "./entity-behaviour";
import { JsonSerializedData } from '../interfaces/json-serialized-data.interface';
import { Transform } from '../core/transform';


/**
 * Defines the key mappings for camera movement.
 */
export interface ICameraMoveKeys {
  /** Key for moving forward. */
  forward: string,
  /** Key for moving backward. */
  back: string,
  /** Key for strafing left. */
  left: string
  /** Key for strafing right. */
  right: string,
  /** Key for moving up. */
  up: string,
  /** Key for moving down. */
  down: string,
  /** Key for boosting movement speed. */
  boost: string,
}
/**
 * Defines the mouse button mappings for camera control.
 */
export interface ICameraMouseButtons {
  /** Mouse button for panning (moving up/down and left/right). */
  pan: number,
  /** Mouse button for looking around (rotating). */
  look: number
}
/**
   CameraFlyBehaviour
  
 * Implements a free-look camera controller, often referred to as "flycam" or "FPS camera."
 * It allows movement with W/A/S/D/Q/E keys and rotation with mouse input.
 * The movement includes smooth acceleration and deceleration, and rotation is smoothly dampened.
 *
 * This behaviour can be attached to an Entity to control its transform,
 * making it behave like a camera in a 3D scene.
 *
 * @extends EntityBehaviour
 */
export class CameraFlyBehaviour extends EntityBehaviour {


  /**
   * Instantiates a new CameraFlyBehaviour instance.
   * @returns {CameraFlyBehaviour} A new instance of CameraFlyBehaviour.
   */
  static override instanciate(): CameraFlyBehaviour { return new CameraFlyBehaviour(); }

  /**
   * The maximum speed at which the camera can move.
   * @type {number}
   * @default 20
   */
  public moveSpeed = 20.5;

  /**
   * The sensitivity of mouse input for camera rotation.
   * @type {number}
   * @default 0.8
   */
  public rotationSpeed = 0.35;

  /**
   * The dampening factor for rotation. A higher value means rotation snaps faster.
   * Value between 0 and 1.
   * @type {number}
   * @default 0.4
   */
  public rotationDampening = 0.16;

  /**
   * The dampening factor for movement. A higher value means movement stops faster.
   * Value between 0 and 1.
   * @type {number}
   * @default 0.15
   */
  public moveDampening = 0.2;

  /**
   * The sensitivity of the mouse scroll wheel for moving forward and backward.
   * @type {number}
   * @default 1.0
   */
  public scrollSpeed = 1.0;

  /**
   * The multiplier applied to `moveSpeed` when the boost key is held down.
   * @type {number}
   * @default 2.0
   */
  public boostMultiplier = 2.0;

  /**
   * The key mappings for movement controls.
   * @type {ICameraMoveKeys}
   */
  public moveKeys: ICameraMoveKeys = {
    forward: "w",
    back: "s",
    left: "a",
    right: "d",
    up: "q",
    down: "e",
    boost: "shift"
  }

  /**
   * The mouse button mappings for camera controls.
   * @type {ICameraMouseButtons}
   */
  public lookMouseButtons: ICameraMouseButtons = {
    pan: 1,
    look: 2
  }

  /**
   * The rate at which the camera accelerates to `moveSpeed`.
   * @type {number}
   * @default 10
   */
  protected _acceleration = 3;

  /** @protected Current forward/backward velocity. */
  protected _forwardVelocity = 0;
  /** @protected Current strafe (left/right) velocity. */
  protected _strafeVelocity = 0;
  /** @protected Current up/down velocity. */
  protected _upVelocity = 0;

  /** @protected Current accumulated yaw (horizontal rotation) in degrees. */
  protected _currentYaw = 0;
  /** @protected Current accumulated pitch (vertical rotation) in degrees. */
  protected _currentPitch = 0;


  /**
   * Creates an instance of CameraFlyBehaviour.
   */
  constructor() {
    super();
    this._className = "CameraFlyBehaviour";
  }

  override initialize(): boolean {
    this._currentPitch = this.transform.localRotation[0];
    this._currentYaw = this.transform.localRotation[1];
    return super.initialize();
  }
  /**
   * Updates the camera's state based on input.
   * @param {number} ellapsed - The time elapsed since the last update in seconds.
   */
  override update(ellapsed: number): void {
    this.updateInput(ellapsed);
    super.update(ellapsed);
  }


  /**
   * Updates all movement velocities based on key inputs.
   * @param {number} ellapsed - The time elapsed since the last frame.
   * @protected
   */
  protected updateMoveVelocity(ellapsed: number) {
    const accelerationDelta = this._acceleration * ellapsed;
    const maxSpeed = Keybord.keyDown[this.moveKeys.boost]
      ? this.moveSpeed * this.boostMultiplier
      : this.moveSpeed;
    const stopThreshold = 0.1;

    this.updateForwardVelocity(accelerationDelta, maxSpeed, stopThreshold);
    this.updateStrafeVelocity(accelerationDelta, maxSpeed, stopThreshold);
    this.updateUpVelocity(accelerationDelta, maxSpeed, stopThreshold);

  }

  /**
   * Updates the forward/backward velocity based on input.
   * @param {number} accelerationDelta - The acceleration to apply for this frame.
   * @param {number} maxSpeed - The maximum speed.
   * @param {number} stopThreshold - The velocity below which movement stops completely.
   */
  protected updateForwardVelocity(accelerationDelta: number, maxSpeed: number, stopThreshold: number) {
    if (Keybord.keyDown[this.moveKeys.forward]) {
      this._forwardVelocity = Math.min(this._forwardVelocity + accelerationDelta, maxSpeed);
    } else if (Keybord.keyDown[this.moveKeys.back]) {
      this._forwardVelocity = Math.max(this._forwardVelocity - accelerationDelta, -maxSpeed);
    } else {
      this._forwardVelocity *= (1 - this.moveDampening);
      if (Math.abs(this._forwardVelocity) < stopThreshold) {
        this._forwardVelocity = 0;
      }
    }
  }

  /**
   * Updates the strafe (left/right) velocity based on input.
   * @param {number} accelerationDelta - The acceleration to apply for this frame.
   * @param {number} maxSpeed - The maximum speed.
   * @param {number} stopThreshold - The velocity below which movement stops completely.
   */
  protected updateStrafeVelocity(accelerationDelta: number, maxSpeed: number, stopThreshold: number) {
    if (Keybord.keyDown[this.moveKeys.left]) {
      this._strafeVelocity = Math.min(this._strafeVelocity + accelerationDelta, maxSpeed);
    } else if (Keybord.keyDown[this.moveKeys.right]) {
      this._strafeVelocity = Math.max(this._strafeVelocity - accelerationDelta, -maxSpeed);
    } else {
      this._strafeVelocity *= (1 - this.moveDampening);
      if (Math.abs(this._strafeVelocity) < stopThreshold) {
        this._strafeVelocity = 0;
      }
    }
  }

  /**
   * Updates the up/down velocity based on input.
   * @param {number} accelerationDelta - The acceleration to apply for this frame.
   * @param {number} maxSpeed - The maximum speed.
   * @param {number} stopThreshold - The velocity below which movement stops completely.
   */
  protected updateUpVelocity(accelerationDelta: number, maxSpeed: number, stopThreshold: number) {
    if (Keybord.keyDown[this.moveKeys.up]) {
      this._upVelocity = Math.max(this._upVelocity - accelerationDelta, -maxSpeed);
    } else if (Keybord.keyDown[this.moveKeys.down]) {
      this._upVelocity = Math.min(this._upVelocity + accelerationDelta, maxSpeed);
    } else {
      this._upVelocity *= (1 - this.moveDampening);
      if (Math.abs(this._upVelocity) < stopThreshold) {
        this._upVelocity = 0;
      }
    }
  }

  /**
   * Updates the camera's pan velocity based on mouse movement.
   * @protected
   */
  protected updatePanVelocity() {
    if (Mouse.mouseButtonDown[this.lookMouseButtons.pan]) {
      this._upVelocity += Mouse.mouseMovement.y * this.moveDampening / 2.0;
      this._strafeVelocity += Mouse.mouseMovement.x * this.moveDampening / 2.0;
    }
  }

  /**
   * Updates the forward velocity based on mouse scroll wheel input.
   * @protected
   */
  protected updateScrollVelocity() {
    this._forwardVelocity -= Mouse.wheelY * this._acceleration * this.moveDampening * this.scrollSpeed;
  }

  /**
   * Applies the calculated movement velocities to the entity's transform.
   * @param {Transform} transform - The transform to modify.
   * @param {number} ellapsed - The time elapsed since the last frame.
   * @protected
   */
  protected applyMovementVelocity(transform: Transform, ellapsed: number) {
    const movementVector = vec3.create();

    // Scale and add movement components based on current velocities
    if (Math.abs(this._forwardVelocity) > 0) {
      vec3.scaleAndAdd(movementVector, movementVector, transform.forward, this._forwardVelocity);
    }
    if (Math.abs(this._strafeVelocity) > 0) {
      vec3.scaleAndAdd(movementVector, movementVector, transform.right, this._strafeVelocity);
    }
    if (Math.abs(this._upVelocity) > 0) {
      vec3.scaleAndAdd(movementVector, movementVector, transform.up, this._upVelocity);
    }


    transform.translate(movementVector[0] * ellapsed, movementVector[1] * ellapsed, movementVector[2] * ellapsed);

  }

  /**
   * Applies the calculated rotation velocities to the entity's transform.
   * @param {Transform} transform - The transform to modify.
   * @param {number} ellapsed - The time elapsed since the last frame.
   * @protected
   */
  protected applyRotationVelocity(transform: Transform, ellapsed: number) {
    if (Mouse.mouseButtonDown[this.lookMouseButtons.look]) {
      this._currentYaw += -Mouse.mouseMovement.x * this.rotationSpeed;
      this._currentPitch += Mouse.mouseMovement.y * this.rotationSpeed;
    }

    this._currentPitch = Math.max(-90, Math.min(90, this._currentPitch));

    const yawQuat = quat.create();
    quat.fromEuler(yawQuat, 0, this._currentYaw, 0);

    const pitchQuat = quat.create();
    quat.fromEuler(pitchQuat, this._currentPitch, 0, 0);

    const finalRotation = quat.create();
    quat.multiply(finalRotation, yawQuat, pitchQuat);

    const smoothedRotation = quat.create();
    quat.slerp(smoothedRotation, transform.localRotationQuat, finalRotation, this.rotationDampening);
    transform.worldRotationQuat = smoothedRotation;
  }

  /**
   * Main input processing loop called every frame.
   * @param {number} ellapsed - The time elapsed since the last frame.
   * @protected
   */
  protected updateInput(ellapsed: number) {
    if (!this._initialized || !this.parent?.transform) return;
    const transform = this.parent.transform;

    this.updateMoveVelocity(ellapsed);
    this.updateScrollVelocity();
    this.updatePanVelocity();

    this.applyMovementVelocity(transform, ellapsed);
    this.applyRotationVelocity(transform, ellapsed);

  }

  /**
   * Serializes the camera's properties to a JSON object for persistence.
   * @returns {JsonSerializedData} An object containing the serialized properties.
   */
  override toJsonObject(): JsonSerializedData {
    return {
      ...super.toJsonObject(),
      moveSpeed: this.moveSpeed,
      rotationSpeed: this.rotationSpeed,
      rotationDampening: this.rotationDampening,
      moveDampening: this.moveDampening,
      scrollSpeed: this.scrollSpeed,
      moveKeys: this.moveKeys,
      boostMultiplier: this.boostMultiplier,
      lookMouseButtons: this.lookMouseButtons,
    };
  }

  /**
   * Deserializes the camera's properties from a JSON object.
   * @param {JsonSerializedData} jsonObject - The JSON object to deserialize from.
   */
  override fromJson(jsonObject: JsonSerializedData): void {
    super.fromJson(jsonObject); // Call superclass's fromJson first
    if (jsonObject['moveSpeed'] !== undefined) {
      this.moveSpeed = jsonObject['moveSpeed'];
    }
    if (jsonObject['rotationSpeed'] !== undefined) {
      this.rotationSpeed = jsonObject['rotationSpeed'];
    }
    if (jsonObject['rotationDampening'] !== undefined) {
      this.rotationDampening = jsonObject['rotationDampening'];
    }
    if (jsonObject['moveDampening'] !== undefined) {
      this.moveDampening = jsonObject['moveDampening'];
    }
    if (jsonObject['scrollSpeed'] !== undefined) {
      this.scrollSpeed = jsonObject['scrollSpeed'];
    }
    if (jsonObject['moveKeys'] !== undefined) {
      this.moveKeys = jsonObject['moveKeys'];
    }
    if (jsonObject['boostMultiplier'] !== undefined) {
      this.boostMultiplier = jsonObject['boostMultiplier'];
    }
    if (jsonObject['lookMouseButtons'] !== undefined) {
      this.lookMouseButtons = jsonObject['lookMouseButtons'];
    }
  }
}
