import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  init() {
    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      return;
    }

    this.audioCtx = new AudioContext();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = 0.8;

    this.compressor = this.audioCtx.createDynamicsCompressor();
    this.compressor.threshold.value = -12;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 1024;

    // Connect the shared graph
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
  }

  getAudioContext() { return this.audioCtx; }
  getAnalyserNode() { return this.analyser; }
  getMasterGainNode() { return this.masterGain; }
}