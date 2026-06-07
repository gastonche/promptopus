import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../theme';
import { sans } from '../fonts';
import { pop } from '../lib/anim';

interface Slam {
  big: string;
  unit?: string;
  label: string;
  sub: string;
  accent: string;
}

const SLAMS: Slam[] = [
  { big: '0.99', label: 'QUALITY', sub: 'the open 8B model edged gpt-4o-mini', accent: C.pass },
  { big: '2', unit: '×', label: 'CHEAPER', sub: 'same quality — half the cost', accent: C.pop400 },
  { big: '3', label: 'GRADER FAMILIES', sub: 'deterministic · judge · cost/latency', accent: C.warn },
  { big: '4', label: 'PROVIDERS', sub: 'OpenAI · Anthropic · Workers AI · local', accent: C.pop300 },
];

const WINDOW = 60;

const SlamView: React.FC<{ data: Slam; start: number }> = ({ data, start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - start;
  if (local < -2 || local > WINDOW) return null;

  const s = pop(frame, fps, start, { damping: 10, stiffness: 180, mass: 0.7 });
  const scale = interpolate(s, [0, 1], [0.55, 1]);
  const outO = interpolate(local, [WINDOW - 12, WINDOW], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const inO = interpolate(local, [0, 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const flash = interpolate(local, [0, 9], [0.5, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = inO * outO;

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily: sans, opacity }}>
      <AbsoluteFill
        style={{ background: `radial-gradient(45% 45% at 50% 45%, ${data.accent}33 0%, transparent 70%)`, opacity }}
      />
      <div style={{ transform: `scale(${scale})`, textAlign: 'center' }}>
        <div
          style={{
            fontSize: 320,
            fontWeight: 900,
            lineHeight: 0.9,
            color: '#fff',
            letterSpacing: -10,
            textShadow: `0 0 80px ${data.accent}88`,
          }}
        >
          {data.big}
          {data.unit && <span style={{ color: data.accent }}>{data.unit}</span>}
        </div>
        <div style={{ marginTop: 14, fontSize: 70, fontWeight: 900, color: data.accent, letterSpacing: 2 }}>
          {data.label}
        </div>
        <div style={{ marginTop: 14, fontSize: 34, fontWeight: 600, color: '#cdc7e8' }}>{data.sub}</div>
      </div>
      <AbsoluteFill style={{ background: data.accent, opacity: flash * 0.25, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};

export const DataSlams: React.FC = () => {
  return (
    <AbsoluteFill>
      {SLAMS.map((s, i) => (
        <SlamView key={i} data={s} start={i * WINDOW} />
      ))}
    </AbsoluteFill>
  );
};
