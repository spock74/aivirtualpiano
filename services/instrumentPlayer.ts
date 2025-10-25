type InstrumentType = 'attack' | 'sustain';

interface Instrument {
  name: string;
  type: InstrumentType;
  samples: { [note: string]: string };
}

// Definição dos instrumentos disponíveis e seus respectivos samples e tipos.
export const INSTRUMENTS: { [key: string]: Instrument } = {
  piano: {
    name: 'Piano Acústico',
    type: 'attack',
    samples: {
      C4: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/C4.mp3',
      'C#4': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/Db4.mp3',
      D4: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/D4.mp3',
      'D#4': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/Eb4.mp3',
      E4: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/E4.mp3',
      F4: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/F4.mp3',
      'F#4': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/Gb4.mp3',
      G4: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/G4.mp3',
      'G#4': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/Ab4.mp3',
      A4: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/A4.mp3',
      'A#4': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/Bb4.mp3',
      B4: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/B4.mp3',
      C5: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/C5.mp3',
'C#5': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/Db5.mp3',
D5: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/D5.mp3',
'D#5': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/Eb5.mp3',
E5: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/E5.mp3',
F5: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/F5.mp3',
'F#5': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/Gb5.mp3',
G5: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/G5.mp3',
'G#5': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/Ab5.mp3',
A5: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/A5.mp3',
'A#5': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/Bb5.mp3',
B5: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/B5.mp3',
C6: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/C6.mp3',
'C#6': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/Db6.mp3',
D6: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/D6.mp3',
'D#6': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/Eb6.mp3',
E6: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/E6.mp3',
F6: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/F6.mp3',
'F#6': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/Gb6.mp3',
G6: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/G6.mp3',
'G#6': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/Ab6.mp3',
A6: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/A6.mp3',
'A#6': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/Bb6.mp3',
B6: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/B6.mp3'
    },
  },
  mellotron: {
    name: 'Órgão Mellotron',
    type: 'sustain',
    samples: {
      C4: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/C4.mp3',
      'C#4': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/Db4.mp3',
      D4: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/D4.mp3',
      'D#4': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/Eb4.mp3',
      E4: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/E4.mp3',
      F4: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/F4.mp3',
      'F#4': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/Gb4.mp3',
      G4: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/G4.mp3',
      'G#4': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/Ab4.mp3',
      A4: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/A4.mp3',
      'A#4': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/Bb4.mp3',
      B4: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/B4.mp3',
      C5: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/C5.mp3',
      'C#5': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/Db5.mp3',
      D5: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/D5.mp3',
      'D#5': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/Eb5.mp3',
      E5: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/E5.mp3',
      F5: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/F5.mp3',
      'F#5': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/Gb5.mp3',
      G5: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/G5.mp3',
      'G#5': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/Ab5.mp3',
      A5: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/A5.mp3',
      'A#5': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/Bb5.mp3',
      B5: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/B5.mp3',
      C6: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/C6.mp3',
      'C#6': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/Db6.mp3',
      D6: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/D6.mp3',
      'D#6': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/Eb6.mp3',
      E6: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/E6.mp3',
      F6: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/F6.mp3',
      'F#6': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/Gb6.mp3',
      G6: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/G6.mp3',
      'G#6': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/Ab6.mp3',
      A6: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/A6.mp3',
      'A#6': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/Bb6.mp3',
      B6: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/flute-mp3/B6.mp3'
    },
  },
  synth: {
    name: 'Sintetizador Doce',
    type: 'sustain',
    samples: {
      C4: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/C4.mp3',
      'C#4': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/Db4.mp3',
      D4: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/D4.mp3',
      'D#4': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/Eb4.mp3',
      E4: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/E4.mp3',
      F4: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/F4.mp3',
      'F#4': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/Gb4.mp3',
      G4: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/G4.mp3',
      'G#4': 'https.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/Ab4.mp3',
      A4: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/A4.mp3',
      'A#4': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/Bb4.mp3',
      B4: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/B4.mp3',
      C5: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/C5.mp3',
'C#5': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/Db5.mp3',
D5: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/D5.mp3',
'D#5': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/Eb5.mp3',
E5: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/E5.mp3',
F5: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/F5.mp3',
'F#5': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/Gb5.mp3',
G5: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/G5.mp3',
'G#5': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/Ab5.mp3',
A5: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/A5.mp3',
'A#5': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/Bb5.mp3',
B5: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/B5.mp3',
C6: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/C6.mp3',
'C#6': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/Db6.mp3',
D6: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/D6.mp3',
'D#6': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/Eb6.mp3',
E6: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/E6.mp3',
F6: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/F6.mp3',
'F#6': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/Gb6.mp3',
G6: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/G6.mp3',
'G#6': 'https://gleitz.github.io.com/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/Ab6.mp3',
A6: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/A6.mp3',
'A#6': 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/Bb6.mp3',
B6: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/synth_pad_2_warm-mp3/B6.mp3'
    },
  },
};

class InstrumentPlayer {
  private audioContext: AudioContext;
  private gainNode: GainNode;
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private currentInstrument: Instrument = INSTRUMENTS.piano;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    this.setVolume(0.5); // Volume inicial padrão
  }

  /**
   * Carrega os samples de áudio para um instrumento específico.
   * @param instrumentKey A chave do instrumento a ser carregado (ex: 'piano').
   */
  async loadSamples(instrumentKey: string) {
    this.currentInstrument = INSTRUMENTS[instrumentKey] || INSTRUMENTS.piano;
    this.audioBuffers.clear();
    
    const promises = Object.entries(this.currentInstrument.samples).map(async ([note, url]) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Falha ao carregar sample: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.audioBuffers.set(note, audioBuffer);
      } catch (error) {
        console.error(`Erro ao carregar o sample para a nota ${note} de ${url}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Toca uma nota do instrumento atualmente carregado.
   * @param note A nota a ser tocada (ex: 'C4').
   */
  playNote(note: string) {
    if (this.audioContext.state === 'suspended') this.audioContext.resume();
    
    const buffer = this.audioBuffers.get(note);
    if (!buffer) return;

    // Se a nota já está tocando e é de sustentação, não faz nada.
    if (this.activeSources.has(note) && this.currentInstrument.type === 'sustain') {
      return;
    }

    // Para instrumentos de ataque (piano), para o som anterior para permitir um "re-ataque" limpo.
    if (this.activeSources.has(note) && this.currentInstrument.type === 'attack') {
      this.activeSources.get(note)?.stop();
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);
    source.loop = this.currentInstrument.type === 'sustain';
    source.start(0);

    this.activeSources.set(note, source);

    source.onended = () => {
      if (this.activeSources.get(note) === source) {
        this.activeSources.delete(note);
      }
    };
  }

  /**
   * Para de tocar uma nota. Só tem efeito em instrumentos de sustentação ('sustain').
   * @param note A nota a ser parada.
   */
  stopNote(note: string) {
    if (this.activeSources.has(note) && this.currentInstrument.type === 'sustain') {
      const source = this.activeSources.get(note)!;
      source.stop();
      this.activeSources.delete(note);
    }
  }

  /**
   * Define o volume mestre do player.
   * @param volume Um valor entre 0 (mudo) e 1 (máximo).
   */
  setVolume(volume: number) {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.gainNode.gain.setValueAtTime(clampedVolume, this.audioContext.currentTime);
  }
}

export const instrumentPlayer = new InstrumentPlayer();