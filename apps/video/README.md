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

- **Music:** _"Cinematic Action Percussion Trailer"_ by **Gregor Quendel**
  ([gregorquendel.com](https://www.gregorquendel.com)) — **CC-BY 4.0**. Downloaded by
  [`scripts/get-music.mjs`](scripts/get-music.mjs) to `public/music.mp3` (gitignored). Anywhere the
  video is published, credit Gregor Quendel (CC-BY 4.0).
  - A fully original **CC0** synth bed is also available via `npm run music:synth`
    ([`scripts/gen-music.mjs`](scripts/gen-music.mjs)) if you prefer no attribution.
- Fonts (Inter, JetBrains Mono) load via `@remotion/google-fonts`.
- All visuals are original Promptopus brand assets.

## Notes

- Animate with `useCurrentFrame()` / `interpolate()` / `spring()` only — CSS transitions/animations
  do not render in Remotion.
- The rendered `out/` directory and generated `public/music.wav` are gitignored.
