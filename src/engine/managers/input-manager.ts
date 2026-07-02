
import { Engine } from '../engine';
import { Keybord, Mouse } from '../core';

export class InputManager {
  private engine: Engine;
  private canvas: HTMLCanvasElement;

  constructor(engine: Engine, canvas: HTMLCanvasElement) {
    this.engine = engine;
    this.canvas = canvas;
  }

  public initialize(): void {
    this.canvas.tabIndex = 0; // Make canvas focusable
    // Canvas-specific event listeners
    this.canvas.addEventListener('contextmenu', this.onEngineContextMenu);
    this.canvas.addEventListener('keydown', this.onEngineKeyDown);
    this.canvas.addEventListener('keyup', this.onEngineKeyUp);
    this.canvas.addEventListener('mousemove', this.onEngineMouseMove);
    this.canvas.addEventListener('mousedown', this.onEngineMouseDown);
    this.canvas.addEventListener('mouseup', this.onEngineMouseUp);
    this.canvas.addEventListener('mouseleave', this.onEngineMouseLeave);
    this.canvas.addEventListener('focus', this.onEngineFocus);
    this.canvas.addEventListener('blur', this.onEngineBlur);
    this.canvas.addEventListener('wheel', this.onEngineMouseScroll);

    // Global event listeners
    document.addEventListener(
      'visibilitychange',
      this.onEngineVisibilityChange,
    );
    window.addEventListener('focus', this.onEngineWindowFocus);
    window.addEventListener('blur', this.onEngineWindowBlur);
  }

  private onEngineContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };

  private onEngineKeyDown = (event: KeyboardEvent): void => {
    Keybord.keyDown[event.key.toLowerCase()] = true;
  };

  private onEngineKeyUp = (event: KeyboardEvent): void => {
    if (Keybord.keyDown[event.key.toLowerCase()]) {
      Keybord.keyUp[event.key.toLowerCase()] = true;
      Keybord.keyPress[event.key.toLowerCase()] = true;
    }
    Keybord.keyDown[event.key.toLowerCase()] = false;
  };

  private onEngineMouseMove = (event: MouseEvent): void => {
    const canvasRect = this.canvas.getBoundingClientRect();
    Mouse.mousePosition.x = Math.max(event.clientX - canvasRect.x, 0);
    Mouse.mousePosition.y = Math.max(event.clientY - canvasRect.y, 0);
    Mouse.mouseMovement.x = event.movementX;
    Mouse.mouseMovement.y = event.movementY;
  };

  private onEngineMouseDown = (event: MouseEvent): void => {
    if (this.engine.isFocused) {
      event.preventDefault();
    }
    Mouse.mouseButtonDown[event.button] = true;
  };

  private onEngineMouseUp = (event: MouseEvent): void => {
    Mouse.mouseButtonDown[event.button] = false;
  };

  private onEngineMouseLeave = (): void => {
    for (const buttonIndex in Mouse.mouseButtonDown) {
      if (Mouse.mouseButtonDown[buttonIndex]) {
        Mouse.mouseButtonDown[buttonIndex] = false;
      }
    }
  };

  private onEngineFocus = (): void => {
    this.engine.isFocused = true;
  };

  private onEngineBlur = (): void => {
    this.engine.isFocused = false;
  };

  private onEngineMouseScroll = (event: WheelEvent): void => {
    if (!this.engine.isFocused) return;
    Mouse.wheelY = event.deltaY;
    Mouse.wheelX = event.deltaX;
  };

  private onEngineVisibilityChange = (): void => {
    this.engine.isTabActive = !document.hidden;
  };

  private onEngineWindowFocus = (): void => {
    this.engine.isWindowFocused = true;
  };

  private onEngineWindowBlur = (): void => {
    this.engine.isWindowFocused = false;
  };
}
