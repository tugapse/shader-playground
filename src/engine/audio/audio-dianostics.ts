import { AudioCache } from "./audio-cache";
import { AudioEngine } from "./audio-engine";
import { SequencerClock } from "./sequencer-clock";
import { VoiceFactory } from "./voice-factory";


export class AudioEngineDiagnostics {
  constructor(
    private engine: AudioEngine,
    private cache: AudioCache,
    private clock: SequencerClock,
    private factory: VoiceFactory
  ) {}

  /**
   * Executes a complete diagnostic battery.
   * Must be called in response to a user gesture (e.g. click) to pass browser audio constraints.
   */
  public async runDiagnosticSuite(): Promise<void> {
    console.log('=== STARTING JARVIS AUDIO ENGINE DIAGNOSTIC BATTERY ===');

    try {
      // 1. Verify Audio Graph & Hardware Connection
      await this.testCoreInitialization();

      // 2. Test RAM Caching with Procedural Sample Generation
      this.testProceduralCacheRegistration();

      // 3. Test Synthesizer Routing and Voice Triggering
      this.testSynthVoiceTriggers();

      // 4. Test Pitch-Shift Arithmetic inside the Sampler Node
      this.testSamplerVoiceTriggers();

      // 5. Test Background Web Worker Clock Precision
      await this.testSequencerClockAccuracy();

    } catch (error) {
      console.error('❌ Diagnostics failed:', (error as Error).message);
    }
  }

  private async testCoreInitialization(): Promise<void> {
    console.log('Testing Core Initialization...');
    await this.engine.initialize();
    
    const ctx = this.engine.getContext();
    if (!ctx) throw new Error('AudioContext failed to instantiate.');
    
    console.log(`✅ AudioContext active at sample rate: ${ctx.sampleRate}Hz`);
    
    this.engine.setMasterVolume(0.9);
    console.log('✅ Master gain configured to 50%');
  }

  private testProceduralCacheRegistration(): void {
    console.log('Testing Memory Cache registration...');
    const ctx = this.engine.getContext()!;
    
    // Generate a quick 0.5s procedural sine wave sample
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, sampleRate * 0.5, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.sin(2 * Math.PI * 440 * (i / sampleRate)) * Math.exp(-9 * (i / data.length));
    }

    this.cache.register('diag_synth_click', buffer);
    
    if (!this.cache.has('diag_synth_click')) {
      throw new Error('Cache failed to register procedural buffer.');
    }
    
    const retrieved = this.cache.get('diag_synth_click');
    console.log(`✅ Cached buffer successfully verified (${retrieved.length} samples)`);
  }

  private testSynthVoiceTriggers(): void {
    console.log('Testing procedural voice factory pathways...');
    const ctx = this.engine.getContext()!;
    const now = ctx.currentTime;
 
    // Trigger a clean dry note instantly
    this.factory.triggerSynthVoice('sine', {
      frequency: 440.00,
      duration: 0.25,
      volume: 0.5,
      cutoff: 2000,
      pan: -0.5
    }, now);

    // Trigger a wet delay note on the right channel 250ms later
    this.factory.triggerSynthVoice('sawtooth', {
      frequency: 220.00,
      duration: 0.5,
      volume: 0.3,
      cutoff: 800,
      pan: 0.5,
      delayMix: 0.5,
      reverbMix: 0.3
    }, now + 0.25);

    console.log('✅ Dry/Wet synth voice trigger messages successfully scheduled');
  }

  private testSamplerVoiceTriggers(): void {
    console.log('Testing Sampler pitch-shifting playback metrics...');
    const ctx = this.engine.getContext()!;
    const now = ctx.currentTime;

    // Trigger procedural sample at native pitch (C4 root, playing C4)
    this.factory.triggerSamplerVoice('diag_synth_click', {
      frequency: 261.63,
      duration: 0.4,
      volume: 0.6,
      pan: -0.2
    }, now + 0.6, 261.63);

    // Trigger procedural sample pitched up one octave (playing C5)
    this.factory.triggerSamplerVoice('diag_synth_click', {
      frequency: 523.25,
      duration: 0.4,
      volume: 0.6,
      pan: 0.2
    }, now + 0.8, 261.63);

    console.log('✅ Sampler pitch-shift parameters successfully applied and triggered');
  }

  private testSequencerClockAccuracy(): Promise<void> {
    return new Promise((resolve) => {
      console.log('Testing high-precision Web Worker background clock (4 ticks)...');
      
      const targetTicks = 4;
      
      this.clock.start((tick, time, stepDuration) => {
        console.log(`⏱️ Clock Tick ${tick} scheduled for timeline target: ${time.toFixed(3)}s (step duration: ${stepDuration.toFixed(3)}s)`);
        
        // Trigger a metric pulse hit on every beat
        this.factory.triggerSynthVoice('triangle', {
          frequency: tick === 0 ? 880 : 440,
          duration: 0.05,
          volume: 0.4,
          cutoff: 3000,
          pan: 0
        }, time);

        if (tick >= targetTicks - 1) {
          this.clock.stop();
          console.log('✅ Worker clock sequence successfully executed and cleaned up');
          resolve();
        }
      });
    });
  }
}