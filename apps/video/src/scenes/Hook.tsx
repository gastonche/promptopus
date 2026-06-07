import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../theme';
import { sans } from '../fonts';
import { fadeUp, fadeOut, pop } from '../lib/anim';

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const q = fadeUp(frame, 4, 14, 30);
  const qOut = fadeOut(frame, 42, 12);

  const slam = pop(frame, fps, 48, { damping: 11, stiffness: 170, mass: 0.7 });
  const slamScale = interpolate(slam, [0, 1], [0.7, 1]);
  const flash = interpolate(frame, [48, 56], [0.6, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily: sans }}>
      <div
        style={{
          position: 'absolute',
          opacity: q.opacity * qOut,
          transform: q.transform,
          color: '#cdc7e8',
          fontSize: 56,
          fontWeight: 600,
          textAlign: 'center',
          letterSpacing: -1,
        }}
      >
        Which model should you ship?
      </div>

      <div
        style={{
          opacity: interpolate(frame, [46, 52], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          transform: `scale(${slamScale})`,
          textAlign: 'center',
          lineHeight: 1.0,
        }}
      >
        <div style={{ fontSize: 150, fontWeight: 900, color: C.white, letterSpacing: -4 }}>STOP</div>
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
