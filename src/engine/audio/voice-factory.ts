/**
 * Decoupled, Hybrid Synthesis and Sampler Voice Factory.
 * Instantiates low-latency, modular synth voices and pitch-shifted sampler voices.
 */

import { AudioCache } from './audio-cache';

export interface VoiceTriggerOptions {
  frequency: number;
  duration: number;
  startTime: number;
  volume?: number;
  pan?: number;
  cutoff?: number;
  reverbMix?: number;
  delayMix?: number;
  distortionMix?: number;
  chorusMix?: number;
  glideTime?: number;
  lfoRate?: number;
  lfoDepth?: number;
}

export class VoiceFactory {
  constructor(
    private audioContext: AudioContext,
    private audioCache: AudioCache,
    private routingDestination: AudioNode,
    private reverbBus?: AudioNode,
    private delayBus?: AudioNode
  ) {}

  /**
   * Spawns a procedural synthesizer voice.
   */
  public triggerSynthVoice(
    waveform: OscillatorType, 
    note: any, 
    startTime: number, 
    prevFrequency?: number
  ): OscillatorNode {
    const ctx = this.audioContext;
    const dest = this.createSubGraph(note, startTime, note.duration);

    const osc = ctx.createOscillator();
    osc.type = waveform;

    // Apply glide / portamento
    if (note.glideTime > 0 && prevFrequency !== undefined) {
      osc.frequency.setValueAtTime(prevFrequency, startTime);
      osc.frequency.exponentialRampToValueAtTime(note.frequency, startTime + note.glideTime);
    } else {
      osc.frequency.setValueAtTime(note.frequency, startTime);
    }

    // Apply LFO modulation
    if (note.lfoDepth > 0) {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(note.lfoRate, startTime);
      lfoGain.gain.setValueAtTime(note.lfoDepth, startTime);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(startTime);
      lfo.stop(startTime + note.duration + 0.1);
    }

    osc.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + note.duration + 0.1);

    return osc;
  }

  /**
   * Spawns a noise voice for snare/percussion modeling.
   */
  public triggerNoiseVoice(note: any, startTime: number): AudioBufferSourceNode {
    const ctx = this.audioContext;
    const dest = this.createSubGraph(note, startTime, note.duration, true);

    const source = ctx.createBufferSource();
    source.buffer = this.getWhiteNoiseBuffer();
    source.loop = true;

    source.connect(dest);
    source.start(startTime);
    source.stop(startTime + note.duration + 0.1);

    return source;
  }

  /**
   * Spawns a pitch-shifted, cache-driven Sampler Voice.
   * Formula: playbackRate = targetFrequency / rootFrequency
   */
  public triggerSamplerVoice(
    sampleId: string, 
    note: any, 
    startTime: number, 
    rootFrequency = 261.63 // Middle C default
  ): AudioBufferSourceNode {
    const ctx = this.audioContext;
    const sampleBuffer = this.audioCache.get(sampleId);
    
    const dest = this.createSubGraph(note, startTime, note.duration);

    const source = ctx.createBufferSource();
    source.buffer = sampleBuffer;

    // Pitch shift sample by adjusting playback speed relative to root pitch
    const targetPlaybackRate = note.frequency / rootFrequency;
    source.playbackRate.setValueAtTime(targetPlaybackRate, startTime);

    source.connect(dest);
    source.start(startTime);
    source.stop(startTime + note.duration + 0.1);

    return source;
  }

  /**
   * Builds the envelope, filtering, panning, and parallel effects send lines for a voice.
   */
  private createSubGraph(
    note: any, 
    startTime: number, 
    duration: number, 
    isNoise = false
  ): AudioNode {
    const ctx = this.audioContext;
    const noteEnd = startTime + duration;

    const envelopeGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const panner = ctx.createStereoPanner();

    filter.type = isNoise ? 'highpass' : 'lowpass';
    filter.frequency.setValueAtTime(note.cutoff || 2000, startTime);
    filter.Q.setValueAtTime(isNoise ? 1 : 2, startTime);

    panner.pan.setValueAtTime(note.pan || 0, startTime);

    // Apply ADSR Envelope
    const attack = isNoise ? 0.005 : 0.02;
    const release = 0.1;
    const peakVolume = note.volume !== undefined ? note.volume * 0.8 : 0.8;

    envelopeGain.gain.setValueAtTime(0, startTime);
    envelopeGain.gain.linearRampToValueAtTime(peakVolume, startTime + attack);
    envelopeGain.gain.setValueAtTime(peakVolume, Math.max(startTime + attack, noteEnd - release));
    envelopeGain.gain.linearRampToValueAtTime(0.001, noteEnd);

    // Connect the local graph
    envelopeGain.connect(filter);
    filter.connect(panner);
    panner.connect(this.routingDestination);

    // Parallel effects sends
    this.routeParallelSends(note, panner, startTime);

    return envelopeGain;
  }

  private routeParallelSends(note: any, sourceNode: AudioNode, startTime: number): void {
    const ctx = this.audioContext;

    if (note.reverbMix > 0 && this.reverbBus) {
      const revSend = ctx.createGain();
      revSend.gain.setValueAtTime(note.reverbMix * 0.7, startTime);
      sourceNode.connect(revSend);
      revSend.connect(this.reverbBus);
    }

    if (note.delayMix > 0 && this.delayBus) {
      const delSend = ctx.createGain();
      delSend.gain.setValueAtTime(note.delayMix * 0.6, startTime);
      sourceNode.connect(delSend);
      delSend.connect(this.delayBus);
    }

    if (note.distortionMix > 0) {
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(note.distortionMix * 100);
      shaper.oversample = '4x';
      
      const distSend = ctx.createGain();
      distSend.gain.setValueAtTime(note.distortionMix * 0.5, startTime);
      
      sourceNode.connect(shaper);
      shaper.connect(distSend);
      distSend.connect(this.routingDestination);
    }
  }

  private getWhiteNoiseBuffer(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = sampleRate * 2.0;
    const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    return buffer;
  }

  private makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = i * 2 / n_samples - 1;
      curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }
}