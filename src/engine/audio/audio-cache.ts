/**
 * Framework-agnostic Audio Cache and Streaming Manager.
 * Handles RAM caching of short audio assets with toggleable LRU eviction and background streaming.
 */

export interface CacheConfig {
  useLRU: boolean;
  maxCacheBytes: number; // Maximum RAM ceiling for cached uncompressed PCM buffers
}

export class AudioCache {
  private cache = new Map<string, AudioBuffer>();
  private activeStreams = new Map<string, HTMLAudioElement>();
  
  // LRU Tracking Properties
  private lruQueue: string[] = [];
  private currentCacheBytes = 0;

  constructor(
    private audioContext: AudioContext,
    private config: CacheConfig = { useLRU: true, maxCacheBytes: 50 * 1024 * 1024 } // 50MB Default
  ) {}

  /**
   * Fetches an audio asset using a relative URL, decodes it off-thread, and caches it in RAM.
   */
  public async load(id: string, relativeUrl: string): Promise<AudioBuffer> {
    if (this.cache.has(id)) {
      this.updateAccess(id);
      return this.cache.get(id)!;
    }

    try {
      const response = await fetch(relativeUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch asset from "${relativeUrl}": ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      const estimatedBytes = this.estimateBufferSize(audioBuffer);
      if (this.config.useLRU) {
        this.evictToFit(estimatedBytes);
      }

      this.cache.set(id, audioBuffer);
      this.currentCacheBytes += estimatedBytes;
      this.lruQueue.push(id);

      return audioBuffer;
    } catch (error) {
      throw new Error(`Asset load failed for "${id}": ${(error as Error).message}`);
    }
  }

  public get(id: string): AudioBuffer {
    const buffer = this.cache.get(id);
    if (!buffer) {
      throw new Error(`Asset "${id}" is not loaded in the memory cache.`);
    }
    this.updateAccess(id);
    return buffer;
  }

  public register(id: string, buffer: AudioBuffer): void {
    const bytes = this.estimateBufferSize(buffer);
    if (this.config.useLRU) {
      this.evictToFit(bytes);
    }
    this.cache.set(id, buffer);
    this.currentCacheBytes += bytes;
    this.lruQueue.push(id);
  }

  public has(id: string): boolean {
    return this.cache.has(id);
  }

  public unload(id: string): void {
    const buffer = this.cache.get(id);
    if (buffer) {
      this.currentCacheBytes -= this.estimateBufferSize(buffer);
      this.cache.delete(id);
      this.lruQueue = this.lruQueue.filter(item => item !== id);
    }
  }

  public clear(): void {
    this.cache.clear();
    this.lruQueue = [];
    this.currentCacheBytes = 0;
  }

  public setLRU(enabled: boolean): void {
    this.config.useLRU = enabled;
    if (enabled) {
      this.evictToFit(0);
    }
  }

  /**
   * HTML5 Audio streaming element connection for long-form backing tracks.
   */
  public createStream(id: string, relativeUrl: string, outputNode: AudioNode): HTMLAudioElement {
    if (this.activeStreams.has(id)) {
      return this.activeStreams.get(id)!;
    }

    const audio = new Audio();
    audio.src = relativeUrl;
    audio.crossOrigin = 'anonymous';
    audio.loop = true;
    audio.autoplay = false;

    const source = this.audioContext.createMediaElementSource(audio);
    source.connect(outputNode);

    this.activeStreams.set(id, audio);
    return audio;
  }

  public destroyStream(id: string): void {
    const audio = this.activeStreams.get(id);
    if (audio) {
      audio.pause();
      audio.src = '';
      audio.load(); // Forces allocation cleanup of stream packets
      this.activeStreams.delete(id);
    }
  }

  // --- LRU Internals ---

  private updateAccess(id: string): void {
    if (this.config.useLRU) {
      this.lruQueue = this.lruQueue.filter(item => item !== id);
      this.lruQueue.push(id);
    }
  }

  private evictToFit(incomingBytes: number): void {
    while (
      this.currentCacheBytes + incomingBytes > this.config.maxCacheBytes && 
      this.lruQueue.length > 0
    ) {
      const oldestId = this.lruQueue.shift();
      if (oldestId) {
        const buffer = this.cache.get(oldestId);
        if (buffer) {
          this.currentCacheBytes -= this.estimateBufferSize(buffer);
          this.cache.delete(oldestId);
        }
      }
    }
  }

  private estimateBufferSize(buffer: AudioBuffer): number {
    // Uncompressed PCM byte size estimate: channels * length * 4 (32-bit floats)
    return buffer.numberOfChannels * buffer.length * 4;
  }
}