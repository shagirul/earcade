# Pitch Arcade design system

The semantic color, type, spacing, and motion tokens live in [tokens.css](src/styles/tokens.css). The arcade components are in [globals.css](src/styles/globals.css), and [Synth Lab](synth-lab/synth-lab.css) uses the same tokens.

- Use amber for the main action and timer, green for a correct answer, and red for a miss or an urgent timer.
- Use the condensed display face for headlines and scores, the monospace stack for labels, and the system sans-serif for instructions.
- Keep the keyboard neutral before an answer. Pair answer colors with explicit text and keep score and time changes next to their counters.
- Use one primary action per screen. Keep all twelve keys visible in landscape and retain the static feedback when reduced motion is enabled.

The home composition lives in [home.css](src/features/home/home.css), and the gameplay and score motion live in [noteRush.css](src/features/noteRush/noteRush.css).

## Audio plugins

Add instruments as implementations of `SoundPlugin` and register them in [src/audio/index.ts](src/audio/index.ts). Screens send sound events through the existing engine.
