import type { ReactNode } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../theme';
import { Grain } from '../components/Background';

export const CinematicBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / durationInFrames;
  const g1x = interpolate(t, [0, 1], [20, 55]);
  const g2x = interpolate(t, [0, 1], [85, 50]);
  const pulse = 0.8 + 0.2 * Math.sin(frame / 30);

  return (
    <AbsoluteFill style={{ backgroundColor: C.inkDeep }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(38% 55% at ${g1x}% 28%, ${C.pop700}55 0%, transparent 70%)`,
          opacity: pulse,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(36% 52% at ${g2x}% 78%, ${C.pop500}44 0%, transparent 70%)`,
          opacity: 1.6 - pulse,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(130% 130% at 50% 50%, transparent 50%, ${C.inkDeep}dd 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const Letterbox: React.FC = () => {
  const frame = useCurrentFrame();
  const h = interpolate(frame, [0, 18], [140, 88], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: h, background: '#000' }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: h,
          background: '#000',
        }}
      />
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};

export const FadeScene: React.FC<{ dur: number; children: ReactNode }> = ({ dur, children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 14, dur - 16, dur], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scale = interpolate(frame, [0, dur], [1.015, 1.0]);
  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill
        style={{ transform: `scale(${scale})`, alignItems: 'center', justifyContent: 'center' }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
