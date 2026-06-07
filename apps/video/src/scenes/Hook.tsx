import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../theme';
import { mono, sans } from '../fonts';
import { fadeOut, pop } from '../lib/anim';

const NAMES = [
  'gpt-4o',
  'claude-sonnet-4.5',
  'llama-3.1-70b',
  'gemini-2.5-flash',
  'mistral-large',
  'gpt-4o-mini',
  'claude-haiku',
  'deepseek-v3',
  'qwen-2.5-72b',
  'command-r+',
];

const REEL_START = 6;
const PERIOD = 5; // frames per name — fast, continuous scroll
const ROW_H = 120;

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- model rolodex: fast continuous scroll, never stops, never lands ---
  const spins = (frame - REEL_START) / PERIOD;
  const i = Math.floor(spins);
  const frac = spins - i;
  const cur = NAMES[((i % NAMES.length) + NAMES.length) % NAMES.length];
  const nxt = NAMES[(((i + 1) % NAMES.length) + NAMES.length) % NAMES.length];

  const reelIn = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const reelOut = fadeOut(frame, 56, 9);
  const reelOpacity = reelIn * reelOut;
  // light constant motion blur to keep the scroll smooth, plus a growing exit-blur
  const exitBlur = interpolate(frame, [52, 66], [0, 14], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const blur = (frame >= REEL_START ? 4 : 0) + exitBlur;

  const kicker =
    interpolate(frame, [2, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) *
    fadeOut(frame, 64, 8);

  // --- payoff ---
  const slam = pop(frame, fps, 68, { damping: 11, stiffness: 175, mass: 0.7 });
  const slamScale = interpolate(slam, [0, 1], [0.7, 1]);
  const slamOpacity = interpolate(frame, [66, 72], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const flash = interpolate(frame, [66, 68, 78], [0, 0.7, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const Name: React.FC<{ text: string; y: number }> = ({ text, y }) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `translateY(${y}px)`,
        filter: blur > 0.2 ? `blur(${blur}px)` : 'none',
      }}
    >
      <span style={{ fontFamily: mono, fontSize: 84, fontWeight: 700, color: '#fff' }}>{text}</span>
    </div>
  );

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily: sans }}>
      {frame < 72 && (
        <div style={{ position: 'absolute', top: 350, textAlign: 'center', width: '100%' }}>
          <div
            style={{
              fontFamily: mono,
              fontSize: 38,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: C.pop300,
              opacity: kicker,
            }}
          >
            which model do you ship?
          </div>

          <div
            style={{
              position: 'relative',
              height: ROW_H,
              marginTop: 44,
              overflow: 'hidden',
              opacity: reelOpacity,
              maskImage: 'linear-gradient(to bottom, transparent, #000 24%, #000 76%, transparent)',
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent, #000 24%, #000 76%, transparent)',
            }}
          >
            <Name text={cur} y={-frac * ROW_H} />
            <Name text={nxt} y={(1 - frac) * ROW_H} />
          </div>
        </div>
      )}

      <div
        style={{
          opacity: slamOpacity,
          transform: `scale(${slamScale})`,
          textAlign: 'center',
          lineHeight: 1.0,
        }}
      >
        <div style={{ fontSize: 150, fontWeight: 900, color: C.white, letterSpacing: -4 }}>
          STOP
        </div>
        <div
          style={{
            fontSize: 150,
            fontWeight: 900,
            letterSpacing: -4,
            color: C.pop400,
            textShadow: `0 0 60px ${C.pop500}aa`,
          }}
        >
          GUESSING.
        </div>
      </div>

      <AbsoluteFill style={{ background: C.white, opacity: flash, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
