import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../theme';
import { mono, sans } from '../fonts';
import { Octopus } from '../components/Octopus';
import { CodeCard, Tok } from '../components/CodeCard';
import { countUp, fade, fadeUp, pop } from '../lib/anim';

const K = C.pop400;
const STR = '#a5f3b0';
const G = '#7dd3fc';
const DIM = '#8b86a8';

const Stack: React.FC<{ children: React.ReactNode; gap?: number }> = ({ children, gap = 0 }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap,
      fontFamily: sans,
    }}
  >
    {children}
  </div>
);

// 1 — COLD OPEN
export const ColdOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const k = fade(frame, 6, 14);
  const big = fadeUp(frame, 16, 18, 34);
  const card = fadeUp(frame, 40, 16, 30);
  const blink = frame % 16 < 9 ? 1 : 0.15;
  const verdict = fadeUp(frame, 104, 16, 22);

  return (
    <Stack gap={30}>
      <div
        style={{
          fontFamily: mono,
          fontSize: 30,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: C.pop300,
          opacity: k,
        }}
      >
        shipping an llm feature?
      </div>
      <div
        style={{
          ...big,
          fontSize: 92,
          fontWeight: 800,
          color: '#fff',
          letterSpacing: -2,
          textAlign: 'center',
        }}
      >
        “It worked when I tried it.”
      </div>
      <div style={{ opacity: card.opacity, transform: card.transform }}>
        <CodeCard title="bash" fontSize={30} style={{ width: 1020 }}>
          <div>
            <Tok c={DIM}># which model do we ship?</Tok>
          </div>
          <div>
            <Tok c={K}>$</Tok> gpt-4o-mini · claude · llama-3.1-8b · grok <Tok c={DIM}>?</Tok>
          </div>
          <div>
            <Tok c={K}>$</Tok> <span style={{ opacity: blink }}>▋</span>
          </div>
        </CodeCard>
      </div>
      <div style={{ ...verdict, fontSize: 40, fontWeight: 700, color: K }}>
        That's not an evaluation.
      </div>
    </Stack>
  );
};

// 2 — BRAND REVEAL
const PROVIDERS = ['OpenAI', 'Anthropic', 'Workers AI', 'Grok', 'Mistral', 'Llama'];
export const BrandReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, 6, { damping: 12, stiffness: 110 });
  const octoScale = interpolate(s, [0, 1], [0.5, 1]);
  const word = fadeUp(frame, 78, 16, 28);
  const tag = fadeUp(frame, 92, 16, 22);

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily: sans }}>
      {PROVIDERS.map((p, i) => {
        const ang = (-90 + (i - (PROVIDERS.length - 1) / 2) * 30) * (Math.PI / 180);
        const appear = interpolate(frame, [10 + i * 4, 26 + i * 4], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const pull = interpolate(frame, [44, 72], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const R = 360 * pull;
        const x = Math.cos(ang) * R * 1.4;
        const y = Math.sin(ang) * R;
        return (
          <div
            key={p}
            style={{
              position: 'absolute',
              transform: `translate(${x}px, ${y}px)`,
              opacity: appear * pull,
              fontFamily: mono,
              fontSize: 30,
              color: C.pop200,
              background: '#ffffff10',
              border: '1px solid #ffffff22',
              borderRadius: 99,
              padding: '8px 18px',
            }}
          >
            {p}
          </div>
        );
      })}

      <div style={{ transform: `scale(${octoScale})`, opacity: s }}>
        <Octopus size={300} />
      </div>

      <div style={{ position: 'absolute', top: '64%', textAlign: 'center' }}>
        <div style={{ ...word, fontSize: 92, fontWeight: 900, letterSpacing: -3 }}>
          <span style={{ color: '#fff' }}>Prompt</span>
          <span style={{ color: K }}>opus</span>
        </div>
        <div style={{ ...tag, fontSize: 38, fontWeight: 600, color: '#cdc7e8' }}>
          Stop guessing which model to ship.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// shared two-column landscape layout
const TwoCol: React.FC<{ left: React.ReactNode; right: React.ReactNode }> = ({ left, right }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 80,
      alignItems: 'center',
      width: 1600,
      fontFamily: sans,
    }}
  >
    <div>{left}</div>
    <div>{right}</div>
  </div>
);

const Heading: React.FC<{ kicker: string; title: React.ReactNode; sub?: string }> = ({
  kicker,
  title,
  sub,
}) => {
  const frame = useCurrentFrame();
  const a = fadeUp(frame, 6, 16, 28);
  const b = fadeUp(frame, 16, 16, 24);
  return (
    <div style={{ ...a }}>
      <div
        style={{
          fontFamily: mono,
          fontSize: 26,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: C.pop500,
          fontWeight: 700,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          marginTop: 14,
          fontSize: 76,
          fontWeight: 900,
          color: '#fff',
          letterSpacing: -2,
          lineHeight: 1.05,
        }}
      >
        {title}
      </div>
      {sub && (
        <div style={{ ...b, marginTop: 18, fontSize: 32, color: '#cdc7e8', lineHeight: 1.4 }}>
          {sub}
        </div>
      )}
    </div>
  );
};

// 3 — DEFINE
const YAML: React.ReactNode[] = [
  <>
    <Tok c={K}>name</Tok>: ReadAloud Benchmark
  </>,
  <>
    <Tok c={K}>providers</Tok>:
  </>,
  <>
    {' '}
    - {'{'} name: <Tok c={STR}>gpt-4o-mini</Tok>, kind: openai {'}'}
  </>,
  <>
    {' '}
    - {'{'} name: <Tok c={STR}>llama-3.1-8b</Tok>, kind: openai-compat {'}'}
  </>,
  <>
    {' '}
    <Tok c={DIM}># …8 more models</Tok>
  </>,
  <>
    <Tok c={K}>defaults</Tok>:
  </>,
  <> graders:</>,
  <>
    {' '}
    - {'{'} type: <Tok c={G}>judge-faithfulness</Tok> {'}'}
  </>,
  <>
    {' '}
    - {'{'} type: <Tok c={G}>number-fidelity</Tok> {'}'} <Tok c={DIM}># custom</Tok>
  </>,
];
export const Define: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <TwoCol
      left={
        <Heading
          kicker="01 · Define"
          title={
            <>
              Define it
              <br />
              once.
            </>
          }
          sub="One YAML file: your cases, your models, your graders."
        />
      }
      right={
        <CodeCard title="benchmark.yaml" fontSize={26} style={{ width: 760 }}>
          {YAML.map((l, i) => {
            const a = fadeUp(frame, 22 + i * 5, 10, 14);
            return (
              <div key={i} style={{ opacity: a.opacity, transform: a.transform }}>
                <Tok c={DIM}>{l}</Tok>
              </div>
            );
          })}
        </CodeCard>
      }
    />
  );
};

// 4 — RUN
const RUN_CASES = ['eiffel', 'photosynthesis', 'apollo-11', 'black-holes'];
const RUN_MODELS = [
  'gpt-4o-mini',
  'llama-3.1-8b',
  'mistral-24b',
  'gemma-12b',
  'qwen-32b',
  'qwq-32b',
];
export const Run: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cmd = fadeUp(frame, 6, 14, 20);
  return (
    <Stack gap={36}>
      <Heading kicker="02 · Run" title="Run it everywhere." />
      <div style={{ ...cmd, fontFamily: mono, fontSize: 30, color: '#e9e6f5' }}>
        <Tok c={K}>$</Tok> promptopus run benchmark.yaml
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {RUN_CASES.map((c, row) => (
          <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 220,
                textAlign: 'right',
                fontFamily: mono,
                fontSize: 22,
                color: '#bdb7d6',
              }}
            >
              {c}
            </div>
            {RUN_MODELS.map((_, col) => {
              const idx = row * RUN_MODELS.length + col;
              const s = pop(frame, fps, 26 + idx * 2.2, { damping: 13, stiffness: 220 });
              const ok = col !== RUN_MODELS.length - 1 || row % 2 === 0; // qwq sometimes fails
              const color = ok ? C.pass : C.fail;
              return (
                <div
                  key={col}
                  style={{
                    width: 96,
                    height: 48,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${color}22`,
                    border: `1px solid ${color}66`,
                    transform: `scale(${interpolate(s, [0, 1], [0.4, 1])})`,
                    opacity: s,
                    color,
                    fontFamily: mono,
                    fontSize: 26,
                  }}
                >
                  {ok ? '✓' : '✗'}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Stack>
  );
};

// 5 — COMPARE
interface Row {
  label: string;
  vals: { v: number; fmt: (n: number) => string; tone?: 'best' | 'worst' }[];
}
const COMPARE_MODELS = ['llama-3.1-8b', 'gpt-4o-mini', 'llama-3.3-70b', 'qwq-32b'];
const COMPARE_ROWS: Row[] = [
  {
    label: 'Pass rate',
    vals: [
      { v: 99, fmt: (n) => `${Math.round(n)}%`, tone: 'best' },
      { v: 92, fmt: (n) => `${Math.round(n)}%` },
      { v: 92, fmt: (n) => `${Math.round(n)}%` },
      { v: 39, fmt: (n) => `${Math.round(n)}%`, tone: 'worst' },
    ],
  },
  {
    label: 'Judge',
    vals: [
      { v: 1.0, fmt: (n) => n.toFixed(2), tone: 'best' },
      { v: 1.0, fmt: (n) => n.toFixed(2) },
      { v: 0.93, fmt: (n) => n.toFixed(2) },
      { v: 0.77, fmt: (n) => n.toFixed(2), tone: 'worst' },
    ],
  },
  {
    label: 'Cost',
    vals: [
      { v: 0.0003, fmt: (n) => `$${n.toFixed(4)}`, tone: 'best' },
      { v: 0.0006, fmt: (n) => `$${n.toFixed(4)}` },
      { v: 0.0021, fmt: (n) => `$${n.toFixed(4)}` },
      { v: 0.0033, fmt: (n) => `$${n.toFixed(4)}`, tone: 'worst' },
    ],
  },
  {
    label: 'p95 latency',
    vals: [
      { v: 3220, fmt: (n) => `${Math.round(n)}ms`, tone: 'best' },
      { v: 3859, fmt: (n) => `${Math.round(n)}ms` },
      { v: 4185, fmt: (n) => `${Math.round(n)}ms` },
      { v: 15837, fmt: (n) => `${Math.round(n)}ms`, tone: 'worst' },
    ],
  },
];
const tone = (t?: 'best' | 'worst') => (t === 'best' ? C.pass : t === 'worst' ? C.fail : '#e9e6f5');
export const Compare: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stack gap={36}>
      <Heading kicker="03 · Compare" title="One report. Every model." />
      <div
        style={{
          width: 1500,
          borderRadius: 20,
          overflow: 'hidden',
          border: `1px solid ${C.pop900}`,
          background: '#1b1830',
          fontFamily: sans,
        }}
      >
        <div
          style={{
            display: 'flex',
            background: C.pop700,
            color: '#fff',
            padding: '18px 28px',
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          <div style={{ flex: 1.3 }}>Metric</div>
          {COMPARE_MODELS.map((m) => (
            <div key={m} style={{ flex: 1, textAlign: 'right', fontSize: 24 }}>
              {m}
            </div>
          ))}
        </div>
        {COMPARE_ROWS.map((r, i) => {
          const start = 18 + i * 9;
          const a = fadeUp(frame, start, 12, 16);
          return (
            <div
              key={r.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '18px 28px',
                fontSize: 30,
                background: i % 2 ? '#ffffff08' : 'transparent',
                opacity: a.opacity,
                transform: a.transform,
              }}
            >
              <div style={{ flex: 1.3, color: '#cdc7e8' }}>{r.label}</div>
              {r.vals.map((cell, ci) => (
                <div
                  key={ci}
                  style={{
                    flex: 1,
                    textAlign: 'right',
                    fontFamily: mono,
                    fontWeight: 700,
                    color: tone(cell.tone),
                  }}
                >
                  {cell.fmt(countUp(frame, start + 4, 22, cell.v))}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </Stack>
  );
};

// 6 — GRADER FAMILIES
const FAMS = [
  {
    tag: 'free · instant',
    name: 'Deterministic',
    accent: C.pass,
    icon: 'M20 6 9 17l-5-5',
    items: ['contains · regex', 'json-schema', '+ your own'],
  },
  {
    tag: 'faithfulness · quality',
    name: 'LLM-as-judge',
    accent: C.pop400,
    icon: 'M12 3v18M5 7h14M5 7l-3 7a4 4 0 0 0 6 0L5 7Zm14 0-3 7a4 4 0 0 0 6 0l-3-7Z',
    items: ['structured scores', 'graceful failure'],
  },
  {
    tag: 'budgets · p50/p95',
    name: 'Cost + latency',
    accent: C.warn,
    icon: 'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 0 5-5M4 18a9 9 0 1 1 16 0',
    items: ['per-call budgets', 'first-class metrics'],
  },
];
export const GraderFamilies: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = fadeUp(frame, 6, 16, 26);
  return (
    <Stack gap={48}>
      <div style={{ ...t, textAlign: 'center' }}>
        <div style={{ fontSize: 72, fontWeight: 900, color: '#fff', letterSpacing: -2 }}>
          Three grader families. <span style={{ color: K }}>One interface.</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 28 }}>
        {FAMS.map((f, i) => {
          const s = pop(frame, fps, 20 + i * 8);
          const y = interpolate(s, [0, 1], [50, 0]);
          return (
            <div
              key={f.name}
              style={{
                width: 420,
                background: '#1b1830',
                border: `1px solid ${f.accent}44`,
                borderRadius: 22,
                padding: 34,
                opacity: s,
                transform: `translateY(${y}px)`,
                fontFamily: sans,
                boxShadow: `0 30px 80px -30px ${f.accent}55`,
              }}
            >
              <div
                style={{
                  width: 66,
                  height: 66,
                  borderRadius: 16,
                  background: `${f.accent}22`,
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
                  stroke={f.accent}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={f.icon} />
                </svg>
              </div>
              <div
                style={{
                  marginTop: 20,
                  color: f.accent,
                  fontFamily: mono,
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                {f.tag}
              </div>
              <div style={{ marginTop: 6, color: '#fff', fontSize: 38, fontWeight: 800 }}>
                {f.name}
              </div>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {f.items.map((it) => (
                  <div key={it} style={{ color: '#cdc7e8', fontFamily: mono, fontSize: 22 }}>
                    <span style={{ color: f.accent }}>·</span> {it}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Stack>
  );
};

// 7 — PROOF
export const Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = fadeUp(frame, 6, 16, 26);
  const counters = fadeUp(frame, 26, 16, 22);
  const win = pop(frame, fps, 70, { damping: 11, stiffness: 160 });
  const lose = pop(frame, fps, 88, { damping: 11, stiffness: 160 });
  const kicker = fadeUp(frame, 150, 14, 20);

  const Stat: React.FC<{ to: number; suffix?: string; label: string }> = ({
    to,
    suffix = '',
    label,
  }) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 58, fontWeight: 900, color: '#fff' }}>
        {Math.round(countUp(frame, 30, 30, to))}
        {suffix}
      </div>
      <div style={{ fontFamily: mono, fontSize: 22, color: C.pop300, letterSpacing: 1 }}>
        {label}
      </div>
    </div>
  );

  return (
    <Stack gap={40}>
      <div style={{ ...t, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: mono,
            fontSize: 26,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: C.pop500,
            fontWeight: 700,
          }}
        >
          We dogfood it
        </div>
        <div
          style={{ marginTop: 12, fontSize: 72, fontWeight: 900, color: '#fff', letterSpacing: -2 }}
        >
          A real benchmark, 10 models deep.
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 80,
          opacity: counters.opacity,
          transform: counters.transform,
        }}
      >
        <Stat to={10} label="MODELS" />
        <Stat to={12} label="GRADERS" />
        <Stat to={60} label="EVALUATIONS" />
      </div>

      <div style={{ display: 'flex', gap: 60, alignItems: 'stretch', marginTop: 4 }}>
        <div
          style={{
            transform: `scale(${interpolate(win, [0, 1], [0.7, 1])})`,
            opacity: win,
            textAlign: 'center',
            padding: '24px 50px',
            borderRadius: 20,
            background: `${C.pass}14`,
            border: `1px solid ${C.pass}55`,
          }}
        >
          <div
            style={{
              fontSize: 140,
              fontWeight: 900,
              color: C.pass,
              lineHeight: 1,
              textShadow: `0 0 50px ${C.pass}66`,
            }}
          >
            99%
          </div>
          <div style={{ marginTop: 10, fontSize: 28, color: '#fff', fontWeight: 700 }}>
            llama-3.1-8b
          </div>
          <div style={{ fontSize: 22, color: '#cdc7e8' }}>the open 8B model · $0.0003</div>
        </div>
        <div
          style={{
            transform: `scale(${interpolate(lose, [0, 1], [0.7, 1])})`,
            opacity: lose,
            textAlign: 'center',
            padding: '24px 50px',
            borderRadius: 20,
            background: `${C.fail}14`,
            border: `1px solid ${C.fail}55`,
          }}
        >
          <div
            style={{
              fontSize: 140,
              fontWeight: 900,
              color: C.fail,
              lineHeight: 1,
              textShadow: `0 0 50px ${C.fail}66`,
            }}
          >
            39%
          </div>
          <div style={{ marginTop: 10, fontSize: 28, color: '#fff', fontWeight: 700 }}>qwq-32b</div>
          <div style={{ fontSize: 22, color: '#cdc7e8' }}>a reasoning model · wrong tool</div>
        </div>
      </div>

      <div style={{ ...kicker, fontSize: 36, fontWeight: 700, color: '#cdc7e8' }}>
        Bigger isn't better. <span style={{ color: K }}>The eval proves it.</span>
      </div>
    </Stack>
  );
};

// 8 — EXTEND
const CFG: React.ReactNode[] = [
  <>
    <Tok c={K}>export default</Tok> <Tok c={G}>defineConfig</Tok>({'{'}
  </>,
  <> graders: {'{'}</>,
  <>
    {' '}
    <Tok c={STR}>'number-fidelity'</Tok>: () =&gt; ({'{'}
  </>,
  <>
    {' '}
    grade: ({'{'} output, testCase {'}'}) =&gt; ...,
  </>,
  <> {'}'}),</>,
  <> {'}'},</>,
  <>{'}'});</>,
];
export const Extend: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <TwoCol
      left={
        <Heading
          kicker="04 · Extend"
          title={
            <>
              In your
              <br />
              own code.
            </>
          }
          sub="Add a provider or grader in a promptopus.config.mjs — no fork."
        />
      }
      right={
        <CodeCard title="promptopus.config.mjs" fontSize={26} style={{ width: 760 }}>
          {CFG.map((l, i) => {
            const a = fadeUp(frame, 20 + i * 5, 10, 14);
            return (
              <div key={i} style={{ opacity: a.opacity, transform: a.transform }}>
                <Tok c={DIM}>{l}</Tok>
              </div>
            );
          })}
        </CodeCard>
      }
    />
  );
};

// 9 — CTA
export const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, 6, { damping: 11, stiffness: 120 });
  const word = fadeUp(frame, 22, 16, 26);
  const tag = fadeUp(frame, 32, 16, 22);
  const cmd = pop(frame, fps, 46);
  const links = fadeUp(frame, 66, 16, 20);
  return (
    <Stack gap={14}>
      <div style={{ transform: `scale(${interpolate(s, [0, 1], [0.5, 1])})`, opacity: s }}>
        <Octopus size={210} />
      </div>
      <div style={{ ...word, fontSize: 104, fontWeight: 900, letterSpacing: -3 }}>
        <span style={{ color: '#fff' }}>Prompt</span>
        <span style={{ color: K }}>opus</span>
      </div>
      <div style={{ ...tag, fontSize: 40, fontWeight: 600, color: '#cdc7e8' }}>
        Stop guessing which model to ship.
      </div>
      <div
        style={{
          marginTop: 26,
          padding: '20px 40px',
          borderRadius: 16,
          border: `1px solid ${K}66`,
          background: '#ffffff0c',
          fontFamily: mono,
          fontSize: 42,
          color: '#fff',
          opacity: cmd,
          transform: `scale(${interpolate(cmd, [0, 1], [0.85, 1])})`,
        }}
      >
        <Tok c={K}>$</Tok> npx promptopus init
      </div>
      <div
        style={{
          ...links,
          marginTop: 24,
          display: 'flex',
          gap: 36,
          fontFamily: mono,
          fontSize: 28,
          color: '#bdb7d6',
        }}
      >
        <span>promptopus.pages.dev</span>
        <span style={{ color: '#ffffff30' }}>•</span>
        <span>npm i promptopus</span>
        <span style={{ color: '#ffffff30' }}>•</span>
        <span>MIT</span>
      </div>
    </Stack>
  );
};
