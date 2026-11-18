export const HARMONIC_COUNT = 64;

function harmonicAmplitude(harmonic: number, shape: number) {
  switch (shape) {
    case 0:
      return harmonic === 1 ? 1 : 0;
    case 1:
      return harmonic % 2 ? Math.pow(-1, (harmonic - 1) / 2) / (harmonic * harmonic) : 0;
    case 2:
      return Math.pow(-1, harmonic + 1) / harmonic;
    default:
      return harmonic % 2 ? 1 / harmonic : 0;
  }
}

export function analogSpectrum(position: number) {
  const real = new Float32Array(HARMONIC_COUNT + 1);
  const imag = new Float32Array(HARMONIC_COUNT + 1);
  const sweep = Math.max(0, Math.min(1, position)) * 3;
  const start = Math.min(2, Math.floor(sweep));
  const blend = sweep - start;
  for (let harmonic = 1; harmonic <= HARMONIC_COUNT; harmonic++) {
    imag[harmonic] = harmonicAmplitude(harmonic, start) * (1 - blend) + harmonicAmplitude(harmonic, start + 1) * blend;
  }
  return { real, imag };
}
