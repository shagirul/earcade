export const NOTE_RUSH_SOUNDS = {
  piano: { label: "Piano" },
  sine: {
    label: "Pure Sine",
    patch: {
      a: { pos: 0, level: 0.8 },
      filter: { on: false },
      amp: { a: 0.008, d: 0.15, s: 1, r: 0.08 },
    },
  },
  triangle: {
    label: "Triangle Tone",
    patch: {
      a: { pos: 0.33 },
      amp: { a: 0.012, d: 0.25, s: 0.8, r: 0.22 },
    },
  },
  pluck: {
    label: "Soft Pluck",
    patch: {
      a: { pos: 0.33 },
      amp: { a: 0.005, d: 0.36, s: 0, r: 0.3 },
      filter: { cutoff: 2400, env: 1.5 },
      env: { a: 0.005, d: 0.14, s: 0, r: 0.1 },
      fx: { reverb: 0.19 },
    },
  },
} as const;

