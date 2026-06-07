import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C } from '../theme';
import { mono, sans } from '../fonts';
import { SceneLabel } from '../components/SceneLabel';
import { countUp, fadeUp } from '../lib/anim';

interface Row {
  label: string;
  a: { text: (v: number) => string; to: number; tone?: 'best' | 'worst' };
  b: { text: (v: number) => string; to: number; tone?: 'best' | 'worst' };
}

const ROWS: Row[] = [
  { label: 'Pass rate', a: { text: (v) => `${Math.round(v)}%`, to: 100 }, b: { text: (v) => `${Math.round(v)}%`, to: 100 } },
  { label: 'Judge score', a: { text: (v) => v.toFixed(2), to: 0.96, tone: 'worst' }, b: { text: (v) => v.toFixed(2), to: 0.99, tone: 'best' } },
  { label: 'Cost · total', a: { text: (v) => `$${v.toFixed(4)}`, to: 0.0005, tone: 'worst' }, b: { text: (v) => `$${v.toFixed(4)}`, to: 0.0002, tone: 'best' } },
  { label: 'Latency · p95', a: { text: (v) => `${Math.round(v)}ms`, to: 2436, tone: 'best' }, b: { text: (v) => `${Math.round(v)}ms`, to: 6880, tone: 'worst' } },
];

const toneColor = (tone?: 'best' | 'worst') =>
  tone === 'best' ? C.pass : tone === 'worst' ? C.fail : '#e9e6f5';

export const MontageTable: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <SceneLabel num="03" text="Compare" />
      <div
        style={{
          width: 900,
          borderRadius: 24,
          overflow: 'hidden',
          background: '#1b1830',
          border: `1px solid ${C.pop900}`,
          boxShadow: `0 40px 120px -20px ${C.pop900}`,
          fontFamily: sans,
        }}
      >
        <div style={{ display: 'flex', background: C.pop700, color: '#fff', padding: '20px 32px', fontSize: 30, fontWeight: 700 }}>
          <div style={{ flex: 1.4 }}>Metric</div>
          <div style={{ flex: 1, textAlign: 'right' }}>gpt-4o-mini</div>
          <div style={{ flex: 1, textAlign: 'right' }}>llama-8b</div>
        </div>
        {ROWS.map((r, i) => {
          const start = 16 + i * 10;
          const a = fadeUp(frame, start, 12, 18);
          const va = countUp(frame, start + 4, 24, r.a.to);
          const vb = countUp(frame, start + 4, 24, r.b.to);
          return (
            <div
              key={r.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '20px 32px',
                fontSize: 32,
                background: i % 2 ? '#ffffff08' : 'transparent',
                opacity: a.opacity,
                transform: a.transform,
              }}
            >
              <div style={{ flex: 1.4, color: '#cdc7e8' }}>{r.label}</div>
              <div style={{ flex: 1, textAlign: 'right', fontFamily: mono, fontWeight: 700, color: toneColor(r.a.tone) }}>
                {r.a.text(va)}
              </div>
              <div style={{ flex: 1, textAlign: 'right', fontFamily: mono, fontWeight: 700, color: toneColor(r.b.tone) }}>
                {r.b.text(vb)}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
