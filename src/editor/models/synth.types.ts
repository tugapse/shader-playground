export interface SynthPreset {
  id: string;
  name: string;
  waveform: OscillatorType | 'noise';
  frequency: number;
  cutoff: number;
  duration: number;
  colorClass: string;
  delayMix: number;
  lfoRate: number;
  lfoDepth: number;
  reverbMix: number;
  distortionMix: number;
  pan: number;
  chorusMix: number;
  glideTime: number;
}

export interface SynthNote extends SynthPreset {
  id: string;
  startTime: number;
  trackIndex: number;
}