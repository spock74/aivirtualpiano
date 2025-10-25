type InstrumentType = 'attack' | 'sustain';

interface Instrument {
  name: string;
  type: InstrumentType;
  samples: { [note: string]: string };
}

export const INSTRUMENTS: { [key: string]: Instrument } = {
  piano: {
    name: 'Piano Acústico',
    type: 'attack',
    samples: {
      C4: '/sounds/piano/C4.mp3',
      Db4: '/sounds/piano/Db4.mp3',
      D4: '/sounds/piano/D4.mp3',
      Eb4: '/sounds/piano/Eb4.mp3',
      E4: '/sounds/piano/E4.mp3',
      F4: '/sounds/piano/F4.mp3',
      Gb4: '/sounds/piano/Gb4.mp3',
      G4: '/sounds/piano/G4.mp3',
      Ab4: '/sounds/piano/Ab4.mp3',
      A4: '/sounds/piano/A4.mp3',
      Bb4: '/sounds/piano/Bb4.mp3',
      B4: '/sounds/piano/B4.mp3',
      C5: '/sounds/piano/C5.mp3',
    },
  },
  mellotron: {
    name: 'Órgão Mellotron',
    type: 'sustain',
    samples: {
      C4: '/sounds/mellotron/C4.mp3',
      Db4: '/sounds/mellotron/Db4.mp3',
      D4: '/sounds/mellotron/D4.mp3',
      Eb4: '/sounds/mellotron/Eb4.mp3',
      E4: '/sounds/mellotron/E4.mp3',
      F4: '/sounds/mellotron/F4.mp3',
      Gb4: '/sounds/mellotron/Gb4.mp3',
      G4: '/sounds/mellotron/G4.mp3',
      Ab4: '/sounds/mellotron/Ab4.mp3',
      A4: '/sounds/mellotron/A4.mp3',
      Bb4: '/sounds/mellotron/Bb4.mp3',
      B4: '/sounds/mellotron/B4.mp3',
      C5: '/sounds/mellotron/C5.mp3',
    },
  },
  synth: {
    name: 'Sintetizador Doce',
    type: 'sustain',
    samples: {
      C4: '/sounds/synth/C4.mp3',
      Db4: '/sounds/synth/Db4.mp3',
      D4: '/sounds/synth/D4.mp3',
      Eb4: '/sounds/synth/Eb4.mp3',
      E4: '/sounds/synth/E4.mp3',
      F4: '/sounds/synth/F4.mp3',
      Gb4: '/sounds/synth/Gb4.mp3',
      G4: '/sounds/synth/G4.mp3',
      Ab4: '/sounds/synth/Ab4.mp3',
      A4: '/sounds/synth/A4.mp3',
      Bb4: '/sounds/synth/Bb4.mp3',
      B4: '/sounds/synth/B4.mp3',
      C5: '/sounds/synth/C5.mp3',
    },
  },
};

class InstrumentPlayer {
  private audioContext: AudioContext;
  private gainNode: GainNode;
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  private buffers: Map<string, AudioBuffer> = new Map();
  private currentInstrument: Instrument = INSTRUMENTS.piano;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  async loadSamples(instrumentKey: string) {
    this.currentInstrument = INSTRUMENTS[instrumentKey] || INSTRUMENTS.piano;
    this.buffers.clear();
    const promises = Object.entries(this.currentInstrument.samples).map(async ([note, url]) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch audio file: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.buffers.set(note, audioBuffer);
      } catch (error) {
        console.error(`Failed to load sample for note ${note} from ${url}:`, error);
      }
    });
    await Promise.all(promises);
  }

  playNote(note: string) {
    if (this.audioContext.state === 'suspended') this.audioContext.resume();
    if (this.activeSources.has(note) && this.currentInstrument.type === 'sustain') return;
    if (this.buffers.has(note)) {
      const source = this.audioContext.createBufferSource();
      source.buffer = this.buffers.get(note)!;
      source.connect(this.gainNode);
      source.loop = this.currentInstrument.type === 'sustain';
      source.start(0);
      this.activeSources.set(note, source);
    }
  }

  stopNote(note: string) {
    if (this.activeSources.has(note)) {
      const source = this.activeSources.get(note)!;
      source.stop();
      this.activeSources.delete(note);
    }
  }

  getBuffers() {
    return this.buffers;
  }

  setVolume(volume: number) {
    this.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
  }
}

export const instrumentPlayer = new InstrumentPlayer();