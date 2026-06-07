import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useVideoConfig } from 'remotion';
import { CinematicBackground, FadeScene, Letterbox } from './pitch/Frame';
import { BrandReveal, CTA, ColdOpen, Compare, Define, Extend, GraderFamilies, Proof, Run } from './pitch/scenes';

export type PitchProps = {
  music: boolean;
};

const OVERLAP = 16;

const SCENES: { c: React.FC; d: number }[] = [
  { c: ColdOpen, d: 165 },
  { c: BrandReveal, d: 200 },
  { c: Define, d: 195 },
  { c: Run, d: 215 },
  { c: Compare, d: 235 },
  { c: GraderFamilies, d: 200 },
  { c: Proof, d: 305 },
  { c: Extend, d: 190 },
  { c: CTA, d: 255 },
];

const PLACED = (() => {
  let from = 0;
  return SCENES.map((s) => {
    const placed = { ...s, from };
    from += s.d - OVERLAP;
    return placed;
  });
})();

export const PITCH_TOTAL = PLACED[PLACED.length - 1]!.from + PLACED[PLACED.length - 1]!.d;

export const Pitch: React.FC<PitchProps> = ({ music }) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill>
      <CinematicBackground />
      {PLACED.map(({ c: Comp, d, from }, i) => (
        <Sequence key={i} from={from} durationInFrames={d}>
          <FadeScene dur={d}>
            <Comp />
          </FadeScene>
        </Sequence>
      ))}
      <Letterbox />
      {music && (
        <Audio
          src={staticFile('music.mp3')}
          volume={(f) =>
            interpolate(f, [0, 30, durationInFrames - 60, durationInFrames], [0, 0.6, 0.6, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          }
        />
      )}
    </AbsoluteFill>
  );
};
