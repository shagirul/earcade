import { PIANO_OCTAVE } from "../../game/stages";

export const INTERVALS = [
  ["P1", "Perfect unison"], ["m2", "Minor second"], ["M2", "Major second"],
  ["m3", "Minor third"], ["M3", "Major third"], ["P4", "Perfect fourth"],
  ["TT", "Tritone"], ["P5", "Perfect fifth"], ["m6", "Minor sixth"],
  ["M6", "Major sixth"], ["m7", "Minor seventh"], ["M7", "Major seventh"],
  ["P8", "Perfect octave"],
] as const;

export function pitchName(offset: number) {
  return PIANO_OCTAVE[offset % 12].label.replace("#", "♯") + (4 + Math.floor(offset / 12));
}

export function intervalKeys(root: number) {
  const notes = INTERVALS.map((_, step) => ({
    offset: root + step,
    black: PIANO_OCTAVE[(root + step) % 12].isBlack,
  }));
  const blackWidth = 0.62;
  // Allow half a black key at each edge when the range starts and ends on a sharp.
  const inset = notes[0].black ? blackWidth / 2 : 0;
  const units = notes.filter(note => !note.black).length + 2 * inset;
  let whites = 0;
  return notes.map(({ offset, black }) => {
    const left = inset + whites - (black ? blackWidth / 2 : 0);
    const shortcut = black ? "qwertyui"[whites] : "asdfghjk"[whites];
    if (!black) whites++;
    return {
      offset, black, shortcut, name: pitchName(offset),
      left: 100 * left / units, width: 100 * (black ? blackWidth : 1) / units,
    };
  });
}
