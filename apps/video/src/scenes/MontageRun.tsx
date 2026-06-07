import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../theme';
import { mono } from '../fonts';
import { SceneLabel } from '../components/SceneLabel';
import { fadeUp, pop } from '../lib/anim';

const CASES = ['eiffel-tower', 'photosynthesis', 'market-recap', 'black-holes', 'coffee-history'];
const PROVIDERS = ['gpt-4o-mini', 'llama-8b'];

const Cell: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = 24 + index * 5;
  const s = pop(frame, fps, start, { damping: 12, stiffness: 200 });
  const scale = interpolate(s, [0, 1], [0.4, 1]);
  return (
    <div
      style={{
        width: 150,
        height: 64,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `${C.pass}22`,
        border: `1px solid ${C.pass}66`,
        transform: `scale(${scale})`,
        opacity: s,
      }}
    >
      <span style={{ color: C.pass, fontSize: 34, fontFamily: mono }}>✓</span>
    </div>
  );
};

export const MontageRun: React.FC = () => {
  const frame = useCurrentFrame();
  const cmd = fadeUp(frame, 4, 12, 18);
  const done = fadeUp(frame, 80, 12, 18);

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <SceneLabel num="02" text="Run" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 26, alignItems: 'center' }}>
        <div
          style={{
            fontFamily: mono,
            fontSize: 34,
            color: '#e9e6f5',
            opacity: cmd.opacity,
            transform: cmd.transform,
          }}
        >
          <span style={{ color: C.pop400 }}>$</span> promptopus run suite.yaml
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ width: 320 }} />
          {PROVIDERS.map((p) => (
            <div
              key={p}
              style={{ width: 150, textAlign: 'center', fontFamily: mono, fontSize: 24, color: C.pop300 }}
            >
              {p}
            </div>
          ))}
        </div>

        {CASES.map((c, row) => (
          <div key={c} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 320, textAlign: 'right', fontFamily: mono, fontSize: 26, color: '#bdb7d6' }}>
              {c}
            </div>
            {PROVIDERS.map((_, col) => (
              <Cell key={col} index={row * PROVIDERS.length + col} />
            ))}
          </div>
        ))}

        <div
          style={{
            fontFamily: mono,
            fontSize: 32,
            color: C.pass,
            opacity: done.opacity,
            transform: done.transform,
          }}
        >
          [10/10] ✓ all cases passed
        </div>
      </div>
    </AbsoluteFill>
  );
};
