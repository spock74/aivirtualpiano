class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeSources: Map<string, { source: AudioBufferSourceNode, gain: GainNode }> = new Map();
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private loadingPromises: Map<string, Promise<AudioBuffer | null>> = new Map();
  // Switched to a complete and reliable sample set from gleitz/midi-js-soundfonts
  private SAMPLES_BASE_URL = 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/';

  private initContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = 0.5; // Default volume
      } catch(e) {
        console.error("Web Audio API is not supported in this browser");
      }
    }
  }

  setVolume(volume: number) {
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.linearRampToValueAtTime(
        Math.max(0, Math.min(1, volume)), // Clamp volume between 0 and 1
        this.audioContext.currentTime + 0.02
      );
    }
  }

  private noteToUrl(note: string): string {
    // This soundfont uses an uppercase note letter, 'sharp' for sharps, and the octave number.
    // e.g., C#4 -> Csharp4.mp3, F4 -> F4.mp3
    const fileName = note.replace('#', 'sharp');
    return `${this.SAMPLES_BASE_URL}${fileName}.mp3`;
  }

  private loadSample(note: string): Promise<AudioBuffer | null> {
    if (this.audioBuffers.has(note)) {
      return Promise.resolve(this.audioBuffers.get(note)!);
    }
    if (this.loadingPromises.has(note)) {
      return this.loadingPromises.get(note)!;
    }
    if (!this.audioContext) {
        this.initContext();
        if (!this.audioContext) return Promise.resolve(null);
    }

    const promise = (async () => {
      try {
        const url = this.noteToUrl(note);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Sample not found for ${note} at ${url}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        this.audioBuffers.set(note, audioBuffer);
        return audioBuffer;
      } catch (e) {
        console.error(`Failed to load sample for note ${note}:`, e);
        return null;
      } finally {
        this.loadingPromises.delete(note); // Clean up promise after completion
      }
    })();
    
    this.loadingPromises.set(note, promise);
    return promise;
  }

  async playNote(note: string, frequency: number) {
    this.initContext();
    if (!this.audioContext || !this.masterGain) return;
    
    const audioBuffer = await this.loadSample(note);
    if (!audioBuffer) return;

    // Stop any existing note before playing a new one to allow for rapid re-triggering
    if (this.activeSources.has(note)) {
      this.stopNote(note, 0.015); // Quick fade to prevent click
    }
    
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;

    const gainNode = this.audioContext.createGain();
    gainNode.connect(this.masterGain);
    source.connect(gainNode);

    const now = this.audioContext.currentTime;
    
    // Quick attack to sound responsive
    const attackTime = 0.01;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1, now + attackTime);
    
    source.start(now);
    
    this.activeSources.set(note, { source, gain: gainNode });

    source.onended = () => {
      // Clean up if the source stops playing on its own and wasn't stopped by stopNote
      if (this.activeSources.get(note)?.source === source) {
        this.activeSources.delete(note);
      }
    };
  }

  stopNote(note: string, customReleaseTime?: number) {
    if (!this.audioContext || !this.activeSources.has(note)) {
      return;
    }
    const active = this.activeSources.get(note);
    if (!active) return;
    
    this.activeSources.delete(note); // Prevent multiple stops on the same source

    const { source, gain } = active;
    const now = this.audioContext.currentTime;
    const releaseTime = customReleaseTime !== undefined ? customReleaseTime : 0.3; // Briefer sound
    
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + releaseTime);
    
    try {
      source.stop(now + releaseTime);
    } catch(e) {
      // It might have already stopped, which is fine.
    }
  }

  resumeContext() {
    this.initContext();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

export const audioPlayer = new AudioPlayer();