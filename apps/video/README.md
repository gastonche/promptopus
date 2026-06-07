# @promptopus/video

Launch videos for Promptopus, built with [Remotion](https://remotion.dev).

## Compositions

- **`Speedrun`** — the launch teaser (approach "B"): a punchy, beat-synced **1080×1080**, **35s**
  social cut for X / LinkedIn. Hook → define → run → compare → grader families → data slams →
  extend → CTA.
- **`Pitch`** — approach "A": a cinematic **1920×1080**, **~61s** launch film for the site hero and
  YouTube. Cold open → brand reveal → define → run → compare → grader families → benchmark proof →
  extend → CTA, with crossfades and letterbox. Scenes live in `src/pitch/`.

## Develop

```bash
npm run music     # download the background track (public/music.mp3)
npm run studio    # open Remotion Studio to preview both compositions
```

## Render

```bash
npm run render        # renders the square teaser → out/promptopus-teaser.mp4
npm run render:pitch  # renders the cinematic film → out/promptopus-pitch.mp4
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
