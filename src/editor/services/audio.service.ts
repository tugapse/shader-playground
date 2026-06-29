import { Injectable } from '@angular/core';
import { AudioCache } from '@engine/audio/audio-cache';
import { AudioEngine } from '@engine/audio/audio-engine';
import { SequencerClock } from '@engine/audio/sequencer-clock';
import { VoiceFactory } from '@engine/audio/voice-factory';


@Injectable({
  providedIn: 'root'
})
export class AudioService {
  // Instantiates the pure TypeScript modules
  public readonly engine = new AudioEngine();
  public readonly cache = new AudioCache(this.engine.getContext());
  public readonly clock = new SequencerClock(this.engine.getContext());
  public readonly factory = new VoiceFactory(
    this.engine.getContext(),
    this.cache,
    this.engine.getSynthBus(),
    this.engine.getReverbBus(),
    this.engine.getDelayBus()
  );

  /**
   * Resumes the suspended context on user gesture.
   */
  public init(): void {
    this.engine.initialize();
  }

  // --- Backwards Compatibility Getters ---

  public getAudioContext(): AudioContext {
    return this.engine.getContext();
  }

  public getAnalyserNode(): AnalyserNode {
    return this.engine.getAnalyser();
  }

  public getMasterGainNode(): GainNode {
    return this.engine.getSynthBus();
  }
}