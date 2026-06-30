/**
 * Web Audio Engine Core.
 * Handles the master graph, sub-mix routing, and global effects return buses.
 * Configured for early-load graph construction with deferred gesture activation.
 */

export interface AudioEngineConfig {
  sampleRate?: number;
  latencyHint?: AudioContextLatencyCategory;
}

export class AudioEngine {
  private ctx: AudioContext;
  
  // Master Chain Nodes
  private masterVolumeNode!: GainNode;
  private dynamicsCompressor!: DynamicsCompressorNode;
  private masterAnalyser!: AnalyserNode;

  // Sub-mix Group Buses
  private synthSubBus!: GainNode;
  private sfxSubBus!: GainNode;
  private musicSubBus!: GainNode;

  // Global Return FX Buses
  private reverbReturnBus!: ConvolverNode;
  private delayReturnBus!: DelayNode;
  private delayFeedbackGain!: GainNode;

  constructor(private config: AudioEngineConfig = {}) {
    // Instantiate AudioContext immediately on class load.
    // The browser automatically initializes this in a "suspended" state
    // to comply with autoplay security policies, allowing safe graph setup.
    const options: AudioContextOptions = {
      latencyHint: this.config.latencyHint || 'interactive'
    };
    if (this.config.sampleRate) {
      options.sampleRate = this.config.sampleRate;
    }

    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)(options);
    
    // Construct the permanent routing topology so components can bind safely on load
    this.buildMasterGraph();
    this.buildFXReturnBuses();
    this.buildSubMixBuses();
  }

  /**
   * Activates the audio context. 
   * Must be called inside a user gesture handler to unmute the suspended audio thread.
   */
  public async initialize(): Promise<void> {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  /**
   * Suspends the audio context thread to free up system CPU/audio hardware resources.
   */
  public async suspend(): Promise<void> {
    if (this.ctx.state === 'running') {
      await this.ctx.suspend();
    }
  }

  /**
   * Resumes the suspended audio context thread.
   */
  public async resume(): Promise<void> {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  /**
   * Builds the main master output block:
   * Master Gain -> Dynamics Compressor -> Analyser -> Physical Audio Output
   */
  private buildMasterGraph(): void {
    this.masterVolumeNode = this.ctx.createGain();
    this.masterVolumeNode.gain.setValueAtTime(0.8, this.ctx.currentTime);

    this.dynamicsCompressor = this.ctx.createDynamicsCompressor();
    this.dynamicsCompressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
    this.dynamicsCompressor.knee.setValueAtTime(30, this.ctx.currentTime);
    this.dynamicsCompressor.ratio.setValueAtTime(12, this.ctx.currentTime);
    this.dynamicsCompressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.dynamicsCompressor.release.setValueAtTime(0.25, this.ctx.currentTime);

    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 1024;

    this.masterVolumeNode.connect(this.dynamicsCompressor);
    this.dynamicsCompressor.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);
  }

  /**
   * Configures shared Return FX buses (Reverb and Feedback Delay).
   * Note voices send percentages of their signals to these parallel chains.
   */
  private buildFXReturnBuses(): void {
    const masterDest = this.masterVolumeNode;

    // Reverb Return Bus
    this.reverbReturnBus = this.ctx.createConvolver();
    this.reverbReturnBus.buffer = this.generateSyntheticImpulseResponse(2.0, 2.0);
    this.reverbReturnBus.connect(masterDest);

    // Feedback Delay Return Bus
    this.delayReturnBus = this.ctx.createDelay(1.0);
    this.delayReturnBus.delayTime.setValueAtTime(0.25, this.ctx.currentTime);

    this.delayFeedbackGain = this.ctx.createGain();
    this.delayFeedbackGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    this.delayReturnBus.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(this.delayReturnBus); 
    this.delayReturnBus.connect(masterDest);
  }

  /**
   * Constructs isolated summing channels for categorization.
   */
  private buildSubMixBuses(): void {
    const masterDest = this.masterVolumeNode;

    this.synthSubBus = this.ctx.createGain();
    this.synthSubBus.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.synthSubBus.connect(masterDest);

    this.sfxSubBus = this.ctx.createGain();
    this.sfxSubBus.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.sfxSubBus.connect(masterDest);

    this.musicSubBus = this.ctx.createGain();
    this.musicSubBus.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.musicSubBus.connect(masterDest);
  }

  /**
   * Generates a procedurally synthesized stereo impulse response buffer for the reverb unit.
   * Note: Eliminates the need to load large external impulse WAV files on startup.
   */
  private generateSyntheticImpulseResponse(duration: number, decay: number): AudioBuffer {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulseBuffer = this.ctx.createBuffer(2, length, sampleRate);

    const left = impulseBuffer.getChannelData(0);
    const right = impulseBuffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const decayEnvelope = Math.pow(1 - i / length, decay);
      left[i] = (Math.random() * 2 - 1) * decayEnvelope;
      right[i] = (Math.random() * 2 - 1) * decayEnvelope;
    }

    return impulseBuffer;
  }

  // --- Utility Getters for Graph Routing ---

  public getContext(): AudioContext {
    return this.ctx;
  }

  public getAnalyser(): AnalyserNode {
    return this.masterAnalyser;
  }

  public getSynthBus(): GainNode {
    return this.synthSubBus;
  }

  public getSfxBus(): GainNode {
    return this.sfxSubBus;
  }

  public getMusicBus(): GainNode {
    return this.musicSubBus;
  }

  public getReverbBus(): ConvolverNode {
    return this.reverbReturnBus;
  }

  public getDelayBus(): DelayNode {
    return this.delayReturnBus;
  }

  // --- Dynamic Level Controls ---

  public setMasterVolume(value: number): void {
    this.masterVolumeNode.gain.setValueAtTime(Math.max(0, Math.min(1, value)), this.ctx.currentTime);
  }

  public setBusVolume(category: 'synth' | 'sfx' | 'music', value: number): void {
    const targetNode = category === 'synth' ? this.synthSubBus : category === 'sfx' ? this.sfxSubBus : this.musicSubBus;
    targetNode.gain.setValueAtTime(Math.max(0, Math.min(2, value)), this.ctx.currentTime);
  }
}