export interface ClockConfig {
  bpm: number;
  ticksPerBeat: number;
  lookaheadMs: number;
  overlapMs: number;
}

export class SequencerClock {
  private worker: Worker | null = null;
  private isRunning = false;
  private currentTick = 0;
  private nextTickTime = 0;
  private onScheduleCallback: ((tick: number, time: number, stepDuration: number) => void) | null = null;

  constructor(
    private audioContext: AudioContext,
    private config: ClockConfig = { bpm: 120, ticksPerBeat: 4, lookaheadMs: 150.0, overlapMs: 35.0 }
  ) {}

  public start(callback: (tick: number, time: number, stepDuration: number) => void): void {
    if (this.isRunning) return;

    this.onScheduleCallback = callback;
    this.isRunning = true;
    
    this.currentTick = 0;
    // Safe timing offset to ensure first ticks don't schedule in the past
    this.nextTickTime = this.audioContext.currentTime + 0.05;

    this.spawnWorker();
    this.worker?.postMessage('start');
  }

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

  private getStepDuration(): number {
    const secondsPerBeat = 60.0 / this.config.bpm;
    return secondsPerBeat / this.config.ticksPerBeat;
  }

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

    URL.revokeObjectURL(url);
  }
}