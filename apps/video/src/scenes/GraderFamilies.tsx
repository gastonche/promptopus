import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../theme';
import { mono, sans } from '../fonts';
import { fadeUp, pop } from '../lib/anim';

const ICON: Record<string, React.ReactNode> = {
  check: <path d="M20 6 9 17l-5-5" />,
  scale: <path d="M12 3v18M5 7h14M5 7l-3 7a4 4 0 0 0 6 0L5 7Zm14 0-3 7a4 4 0 0 0 6 0l-3-7Z" />,
  gauge: <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 0 5-5M4 18a9 9 0 1 1 16 0" />,
};

const CARDS = [
  {
    title: 'Deterministic',
    tag: 'free · instant',
    accent: C.pass,
    icon: 'check',
    items: ['equals', 'contains', 'regex', 'json-schema'],
  },
  {
    title: 'LLM-as-judge',
    tag: 'faithfulness · quality',
    accent: C.pop400,
    icon: 'scale',
    items: ['judge-faithfulness', 'judge-quality'],
  },
  {
    title: 'Cost + latency',
    tag: 'budgets · p50/p95',
    accent: C.warn,
    icon: 'gauge',
    items: ['latency-budget', 'cost-budget'],
  },
];

const Card: React.FC<{ index: number; data: (typeof CARDS)[number] }> = ({ index, data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, 18 + index * 8);
  const y = interpolate(s, [0, 1], [50, 0]);
  return (
    <div
      style={{
        flex: 1,
        background: '#1b1830',
        border: `1px solid ${data.accent}44`,
        borderRadius: 22,
        padding: 30,
        opacity: s,
        transform: `translateY(${y}px)`,
        boxShadow: `0 30px 80px -30px ${data.accent}55`,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: `${data.accent}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width={34}
          height={34}
          viewBox="0 0 24 24"
          fill="none"
          stroke={data.accent}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {ICON[data.icon]}
        </svg>
      </div>
      <div
        style={{
          marginTop: 22,
          color: data.accent,
          fontFamily: mono,
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        {data.tag}
      </div>
      <div
        style={{ marginTop: 6, color: '#fff', fontSize: 38, fontWeight: 800, letterSpacing: -1 }}
      >
        {data.title}
      </div>
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.items.map((it) => (
          <div key={it} style={{ color: '#cdc7e8', fontFamily: mono, fontSize: 24 }}>
            <span style={{ color: data.accent }}>·</span> {it}
          </div>
        ))}
      </div>
    </div>
  );
};

export const GraderFamilies: React.FC = () => {
  const frame = useCurrentFrame();
  const t = fadeUp(frame, 2, 14, 24);
  return (
    <AbsoluteFill
      style={{ alignItems: 'center', justifyContent: 'center', fontFamily: sans, padding: 70 }}
    >
      <div
        style={{
          textAlign: 'center',
          opacity: t.opacity,
          transform: t.transform,
          marginBottom: 44,
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 900, color: '#fff', letterSpacing: -2 }}>
          Three grader families.
        </div>
        <div style={{ fontSize: 64, fontWeight: 900, color: C.pop400, letterSpacing: -2 }}>
          One interface.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 24, width: '100%' }}>
        {CARDS.map((c, i) => (
          <Card key={c.title} index={i} data={c} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
