import type { PianoKey } from './types';

const WHITE_KEY_WIDTH = 40;
const WHITE_KEY_HEIGHT = 150;
const BLACK_KEY_WIDTH = 24;
const BLACK_KEY_HEIGHT = 90;

// Note range shifted up one octave to C4-B6 for a brighter sound.
const notes = [
  // Octave 4
  { note: 'C4', freq: 261.63 }, { note: 'C#4', freq: 277.18 },
  { note: 'D4', freq: 293.66 }, { note: 'D#4', freq: 311.13 },
  { note: 'E4', freq: 329.63 },
  { note: 'F4', freq: 349.23 }, { note: 'F#4', freq: 369.99 },
  { note: 'G4', freq: 392.00 }, { note: 'G#4', freq: 415.30 },
  { note: 'A4', freq: 440.00 }, { note: 'A#4', freq: 466.16 },
  { note: 'B4', freq: 493.88 },

  // Octave 5
  { note: 'C5', freq: 523.25 }, { note: 'C#5', freq: 554.37 },
  { note: 'D5', freq: 587.33 }, { note: 'D#5', freq: 622.25 },
  { note: 'E5', freq: 659.25 },
  { note: 'F5', freq: 698.46 }, { note: 'F#5', freq: 739.99 },
  { note: 'G5', freq: 783.99 }, { note: 'G#5', freq: 830.61 },
  { note: 'A5', freq: 880.00 }, { note: 'A#5', freq: 932.33 },
  { note: 'B5', freq: 987.77 },

  // Octave 6
  { note: 'C6', freq: 1046.50 }, { note: 'C#6', freq: 1108.73 },
  { note: 'D6', freq: 1174.66 }, { note: 'D#6', freq: 1244.51 },
  { note: 'E6', freq: 1318.51 },
  { note: 'F6', freq: 1396.91 }, { note: 'F#6', freq: 1479.98 },
  { note: 'G6', freq: 1567.98 }, { note: 'G#6', freq: 1661.22 },
  { note: 'A6', freq: 1760.00 }, { note: 'A#6', freq: 1864.66 },
  { note: 'B6', freq: 1975.53 },
];

export const PIANO_KEYS: PianoKey[] = [];

let whiteKeyX = 0;
notes.forEach(({ note, freq }) => {
  if (note.includes('#')) {
    // Black key
    PIANO_KEYS.push({
      note,
      frequency: freq,
      type: 'black',
      x: whiteKeyX - BLACK_KEY_WIDTH / 2,
      y: 0,
      width: BLACK_KEY_WIDTH,
      height: BLACK_KEY_HEIGHT,
    });
  } else {
    // White key
    PIANO_KEYS.push({
      note,
      frequency: freq,
      type: 'white',
      x: whiteKeyX,
      y: 0,
      width: WHITE_KEY_WIDTH,
      height: WHITE_KEY_HEIGHT,
    });
    whiteKeyX += WHITE_KEY_WIDTH;
  }
});

export const KEYBOARD_WIDTH = whiteKeyX;
export const KEYBOARD_HEIGHT = WHITE_KEY_HEIGHT;

export const FINGERTIP_LANDMARKS = [4, 8, 12, 16, 20];

export const INSTRUMENT_KEYS = ['piano', 'mellotron', 'synth'];