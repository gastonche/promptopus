import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../theme';

export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.07 }) => {
  return (
    <AbsoluteFill style={{ opacity, mixBlendMode: 'overlay', pointerEvents: 'none' }}>
      <svg width="100%" height="100%">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / durationInFrames;

  const g1x = interpolate(t, [0, 1], [25, 60]);
  const g1y = interpolate(t, [0, 1], [20, 45]);
  const g2x = interpolate(t, [0, 1], [80, 45]);
  const g2y = interpolate(t, [0, 1], [75, 55]);
  const pulse = 0.85 + 0.15 * Math.sin(frame / 18);

  return (
    <AbsoluteFill style={{ backgroundColor: C.inkDeep }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(40% 40% at ${g1x}% ${g1y}%, ${C.pop600}66 0%, transparent 70%)`,
          opacity: pulse,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(38% 38% at ${g2x}% ${g2y}%, ${C.pop500}55 0%, transparent 70%)`,
          opacity: 1.7 - pulse,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 120% at 50% 50%, transparent 55%, ${C.inkDeep}cc 100%)`,
        }}
      />
      <Grain />
    </AbsoluteFill>
  );
};
