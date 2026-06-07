import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../theme';
import { sans } from '../fonts';
import { CodeCard, Tok } from '../components/CodeCard';
import { fadeUp, pop } from '../lib/anim';

const K = C.pop400;
const F = '#7dd3fc';
const S = '#a5f3b0';
const D = '#8b86a8';

const LINES: React.ReactNode[] = [
  <>
    <Tok c={K}>import</Tok> {'{'} defineConfig {'}'} <Tok c={K}>from</Tok>{' '}
    <Tok c={S}>'promptopus'</Tok>;
  </>,
  <> </>,
  <>
    <Tok c={K}>export default</Tok> <Tok c={F}>defineConfig</Tok>({'{'}
  </>,
  <> graders: {'{'}</>,
  <>
    {' '}
    <Tok c={S}>'word-count'</Tok>: (spec) =&gt; ({'{'}
  </>,
  <>
    {' '}
    id: <Tok c={S}>'word-count'</Tok>, family: <Tok c={S}>'deterministic'</Tok>,
  </>,
  <>
    {' '}
    grade: ({'{'} output {'}'}) =&gt; scoreWords(output, spec),
  </>,
  <> {'}'}),</>,
  <> {'}'},</>,
  <>{'}'});</>,
];

export const Extend: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = fadeUp(frame, 2, 14, 24);
  const s = pop(frame, fps, 16);
  const x = interpolate(s, [0, 1], [80, 0]);

  return (
    <AbsoluteFill
      style={{ alignItems: 'center', justifyContent: 'center', fontFamily: sans, padding: 70 }}
    >
      <div
        style={{
          textAlign: 'center',
          opacity: t.opacity,
          transform: t.transform,
          marginBottom: 40,
        }}
      >
        <div style={{ fontSize: 70, fontWeight: 900, color: '#fff', letterSpacing: -2 }}>
          Extend in <span style={{ color: C.pop400 }}>your own code.</span>
        </div>
        <div style={{ marginTop: 12, fontSize: 36, fontWeight: 600, color: '#cdc7e8' }}>
          No fork. Add a provider or grader in a{' '}
          <span style={{ color: C.pop300 }}>promptopus.config.mjs</span>
        </div>
      </div>
      <CodeCard
        title="promptopus.config.mjs"
        fontSize={26}
        style={{ width: 968, opacity: s, transform: `translateX(${x}px)` }}
      >
        {LINES.map((line, i) => {
          const a = fadeUp(frame, 22 + i * 3, 8, 10);
          return (
            <div key={i} style={{ opacity: a.opacity, transform: a.transform }}>
              <Tok c={D}>{line}</Tok>
            </div>
          );
        })}
      </CodeCard>
    </AbsoluteFill>
  );
};
