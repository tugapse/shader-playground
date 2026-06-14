import { JsonSerializable } from './json-serializable';

/**
 * Represents a numeric value constrained within a defined range.
 * It provides mechanisms for clamping the value and ensuring bounds integrity.
 * @augments {JsonSerializable}
 */
export class NumberRange extends JsonSerializable {

  /**
   * Creates an instance of NumberRange.
   * @param {number} _value - The initial value.
   * @param {number} [_min=0] - The minimum bound.
   * @param {number} [_max=0] - The maximum bound.
   * @param {number} [_step=0] - The increment step.
   */
  constructor(
    protected _value: number,
    protected _min = 0,
    protected _max = 0,
    protected _step = 0,
  ) {
    super('Range');
  }

  /**
   * Serializes the range's state to a JSON object.
   * @override
   * @returns {any} - The JSON object representation.
   */
  override toJsonObject(): any {
    return {
      min: this._min,
      max: this._max,
      step: this._step,
      value: this._value,
    };
  }

  /**
   * Deserializes the range's state from a JSON object.
   * @override
   * @param {any} jsonObject - The JSON object to deserialize from.
   */
  override fromJson(jsonObject: any): void {
    this.min = jsonObject.min;
    this.max = jsonObject.max;
    this.step = jsonObject.step;
    this.value = jsonObject.value;
  }

  /**
   * Gets the current value.
   * @type {number}
   */
  get value(): number {
    return this._value;
  }

  /**
   * Sets the current value, clamping it between min and max.
   * @param {number} value - The new value.
   */
  set value(value: number) {
    this._value = Math.max(this._min, Math.min(this._max, value));
  }

  /**
   * Gets the minimum bound.
   * @type {number}
   */
  get min(): number {
    return this._min;
  }

  /**
   * Sets the minimum bound. If it exceeds the maximum, max is adjusted to match min.
   * Re-clamps the current value.
   * @param {number} min - The new minimum.
   */
  set min(min: number) {
    this._min = min;
    if (this._min > this._max) this._max = this._min;
    this.value = this._value; // Re-clamp value
  }

  /**
   * Gets the maximum bound.
   * @type {number}
   */
  get max(): number {
    return this._max;
  }

  /**
   * Sets the maximum bound. If it is less than the minimum, min is adjusted to match max.
   * Re-clamps the current value.
   * @param {number} max - The new maximum.
   */
  set max(max: number) {
    this._max = max;
    if (this._max < this._min) this._min = this._max;
    this.value = this._value; // Re-clamp value
  }

  /**
   * Gets the increment step.
   * @type {number}
   */
  get step(): number {
    return this._step;
  }

  /**
   * Sets the increment step.
   * @param {number} step - The new step.
   */
  set step(step: number) {
    this._step = step;
  }
}
