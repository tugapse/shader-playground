/**
  A static class for managing mouse input state.
 * It tracks button presses, cursor position, and movement deltas.
 */
export class Mouse {
  /**
    A map that stores the pressed state of each mouse button.
   * `true` if the button is currently held down, `false` otherwise.
    
   * @type {{ [key: string]: boolean }}
   */
  public static mouseButtonDown: { [key: string]: boolean } = {};
  /**
    The current position of the mouse cursor relative to the viewport.
    
   * @type {{ x: number, y: number }}
   */
  public static mousePosition: { x: number; y: number } = { x: 0, y: 0 };
  /**
    The movement delta of the mouse since the last frame.
    
   * @type {{ x: number, y: number }}
   */
  public static mouseMovement: { x: number; y: number } = { x: 0, y: 0 };
  /**
    The movement delta of the mouse weel y since the last frame.
    
   * @type {number}
   */
  public static wheelX = 0;
  /**
  The movement delta of the mouse weel x since the last frame.
  
 * @type {number}
 */
  public static wheelY = 0;
}

/**
  A static class for managing keyboard input state.
 * It tracks the pressed, down, and up states of each key.
 */
export class Keybord {
  /**
    A map that stores which keys are currently held down.
    
   * @type {{ [key: string]: boolean }}
   */
  public static keyDown: { [key: string]: boolean } = {};
  /**
    A map that stores which keys were released in the last frame.
    
   * @type {{ [key: string]: boolean }}
   */
  public static keyUp: { [key: string]: boolean } = {};
  /**
    A map that stores which keys were pressed in the last frame.
    
   * @type {{ [key: string]: boolean }}
   */
  public static keyPress: { [key: string]: boolean } = {};
}

export function cleanLastFrame(){
  Mouse.mouseMovement.x = 0;
  Mouse.mouseMovement.y = 0;
  Mouse.wheelX = 0;
  Mouse.wheelY = 0
  Keybord.keyUp = {};
  Keybord.keyPress = {};
}