import { AbsoluteFill, Sequence, Audio, staticFile, interpolate, useVideoConfig } from 'remotion';
import { Background } from './components/Background';
import { Hook } from './scenes/Hook';
import { MontageYaml } from './scenes/MontageYaml';
import { MontageRun } from './scenes/MontageRun';
import { MontageTable } from './scenes/MontageTable';
import { GraderFamilies } from './scenes/GraderFamilies';
import { DataSlams } from './scenes/DataSlams';
import { Extend } from './scenes/Extend';
import { CTA } from './scenes/CTA';

export type SpeedrunProps = {
  music: boolean;
};

const SCENES: { c: React.FC; d: number }[] = [
  { c: Hook, d: 120 },
  { c: MontageYaml, d: 95 },
  { c: MontageRun, d: 105 },
  { c: MontageTable, d: 95 },
  { c: GraderFamilies, d: 100 },
  { c: DataSlams, d: 240 },
  { c: Extend, d: 145 },
  { c: CTA, d: 150 },
];

export const TOTAL = SCENES.reduce((a, s) => a + s.d, 0);

export const Speedrun: React.FC<SpeedrunProps> = ({ music }) => {
  const { durationInFrames } = useVideoConfig();
  let from = 0;
  return (
    <AbsoluteFill>
      <Background />
      {SCENES.map(({ c: Comp, d }, i) => {
        const seq = (
          <Sequence key={i} from={from} durationInFrames={d}>
            <Comp />
          </Sequence>
        );
        from += d;
        return seq;
      })}
      {music && (
        <Audio
          src={staticFile('music.mp3')}
          volume={(f) =>
            interpolate(
              f,
              [0, 18, durationInFrames - 50, durationInFrames],
              [0, 0.62, 0.62, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            )
          }
        />
      )}
    </AbsoluteFill>
  );
};
