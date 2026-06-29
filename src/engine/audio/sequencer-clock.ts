/**
 * Off-thread, High-Precision Web Audio Sequencer Clock.
 * Uses an inline Web Worker timer to bypass main thread browser throttling.
 */

export interface ClockConfig {
  bpm: number;
  ticksPerBeat: number; // Resolution (e.g., 4 for 16th notes per beat)
  lookaheadMs: number;  // Distance into the future to schedule audio nodes (e.g., 75ms)
  overlapMs: number;    // Internal timer polling interval (e.g., 25ms)
}

export class SequencerClock {
  private worker: Worker | null = null;
  private isRunning = false;
  
  // Timing Track Pointers
  private currentTick = 0;
  private nextTickTime = 0; // Relative context timeline tracker

  // Event Subscription Hook
  private onScheduleCallback: ((tick: number, time: number, stepDuration: number) => void) | null = null;

  constructor(
    private audioContext: AudioContext,
    private config: ClockConfig = { bpm: 120, ticksPerBeat: 4, lookaheadMs: 75.0, overlapMs: 25.0 }
  ) {}

  /**
   * Initializes the high-precision background clock loop.
   */
  public start(callback: (tick: number, time: number, stepDuration: number) => void): void {
    if (this.isRunning) return;

    this.onScheduleCallback = callback;
    this.isRunning = true;
    
    this.currentTick = 0;
    this.nextTickTime = this.audioContext.currentTime;

    this.spawnWorker();
    this.worker?.postMessage('start');
  }

  /**
   * Halts the background scheduler.
   */
  public stop(): void {
    if (!this.isRunning) return;
    
    this.worker?.postMessage('stop');
    this.worker?.terminate();
    this.worker = null;
    this.isRunning = false;
  }

  public setBpm(newBpm: number): void {
    this.config.bpm = Math.max(20, Math.min(300, newBpm));
  }

  public getBpm(): number {
    return this.config.bpm;
  }

  public getTick(): number {
    return this.currentTick;
  }

  /**
   * Calculates the raw step time based on the active tempo coefficient.
   */
  private getStepDuration(): number {
    const secondsPerBeat = 60.0 / this.config.bpm;
    return secondsPerBeat / this.config.ticksPerBeat; // Length of a single division
  }

  /**
   * High-accuracy scheduler loop.
   * Runs inside the background worker thread tick to evaluate if steps must be scheduled.
   */
  private scheduleAhead(): void {
    const stepDuration = this.getStepDuration();
    const lookaheadSec = this.config.lookaheadMs / 1000.0;

    while (this.nextTickTime < this.audioContext.currentTime + lookaheadSec) {
      if (this.onScheduleCallback) {
        this.onScheduleCallback(this.currentTick, this.nextTickTime, stepDuration);
      }
      this.advanceTick();
    }
  }

  private advanceTick(): void {
    this.nextTickTime += this.getStepDuration();
    this.currentTick++;
  }

  /**
   * Spawns an inline, zero-latency Web Worker using a Blob URL wrapper.
   * Keeps background performance completely decoupled from main thread rendering.
   */
  private spawnWorker(): void {
    const workerCode = `
      let timerId = null;
      let interval = ${this.config.overlapMs};

      self.onmessage = (e) => {
        if (e.data === 'start') {
          timerId = setInterval(() => self.postMessage('tick'), interval);
        } else if (e.data === 'stop') {
          if (timerId) {
            clearInterval(timerId);
            timerId = null;
          }
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    this.worker = new Worker(url);

    this.worker.onmessage = (e) => {
      if (e.data === 'tick' && this.isRunning) {
        this.scheduleAhead();
      }
    };

    URL.revokeObjectURL(url); // Clean browser pointer allocations
  }
}