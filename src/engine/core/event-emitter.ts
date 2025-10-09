/**
  A simple event emitter class that allows for subscribing to and emitting custom events.
 */
export class EventEmitter {
  /**
    A map to store event listeners, where keys are event names and values are arrays of callback functions.
   * @private
   * @type {Map<string, Function[]>}
   */
  private listeners: Map<string, Function[]> = new Map();

  /**
    Subscribes a callback function to a specific event.
   * @param {string} event - The name of the event to subscribe to.
   * @param {Function} callback - The function to call when the event is emitted.
   * @returns {void}
   */
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  /**
    Emits an event, calling all subscribed callback functions with the provided data.
   * @param {string} event - The name of the event to emit.
   * @param {any} [data] - Optional data to pass to the callback functions.
   * @returns {void}
   */
  public emit(event: string, data?: any): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.forEach(callback => callback(data));
    }
  }
}