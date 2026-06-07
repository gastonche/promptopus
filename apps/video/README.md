# @promptopus/video

Launch videos for Promptopus, built with [Remotion](https://remotion.dev).

## Compositions

- **`Speedrun`** — the launch teaser (approach "B"): a punchy, beat-synced **1080×1080**, **35s**
  social cut for X / LinkedIn. Hook → define → run → compare → grader families → data slams →
  extend → CTA.
- _(planned)_ **`Pitch`** — approach "A": a ~70s cinematic 16:9 launch film for the site hero and
  YouTube. The scene components here are built to be reused for it.

## Develop

```bash
npm run music     # generate the background track (public/music.wav)
npm run studio    # open Remotion Studio to preview
```

## Render

```bash
npm run render    # regenerates music, then renders out/promptopus-teaser.mp4
```

Stills for quick checks: `npx remotion still Speedrun out/f.png --frame=480 --scale=0.5`.

## Assets & licensing

- **Music** is **original and royalty-free (CC0)** — synthesized from scratch by
  [`scripts/gen-music.mjs`](scripts/gen-music.mjs) (a clean A-minor / 120 BPM bed). No third-party
  audio, no attribution required. `public/music.wav` is generated, not committed.
- Fonts (Inter, JetBrains Mono) load via `@remotion/google-fonts`.
- All visuals are original Promptopus brand assets.

## Notes

- Animate with `useCurrentFrame()` / `interpolate()` / `spring()` only — CSS transitions/animations
  do not render in Remotion.
- The rendered `out/` directory and generated `public/music.wav` are gitignored.
