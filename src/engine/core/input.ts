import { EventEmitter } from "./event-emitter";

export class Mouse {
  public static mouseButtonDown: { [key: string]: boolean } = {};
  public static mousePosition: { x: number, y: number } = { x: 0, y: 0 };
  public static mouseMovement: { x: number, y: number } = { x: 0, y: 0 };
}

export class Keybord {
  public static keyDown: { [key: string]: boolean } = {};
  public static keyUp: { [key: string]: boolean } = {};
  public static keyPress: { [key: string]: boolean } = {};
}

