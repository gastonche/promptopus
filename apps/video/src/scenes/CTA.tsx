import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../theme';
import { mono, sans } from '../fonts';
import { Octopus } from '../components/Octopus';
import { fadeUp, pop } from '../lib/anim';

export const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = pop(frame, fps, 4, { damping: 11, stiffness: 130 });
  const octoScale = interpolate(s, [0, 1], [0.4, 1]);

  const word = fadeUp(frame, 18, 14, 26);
  const tag = fadeUp(frame, 28, 14, 22);
  const cmd = pop(frame, fps, 40);
  const cmdScale = interpolate(cmd, [0, 1], [0.8, 1]);
  const links = fadeUp(frame, 60, 14, 20);

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily: sans }}>
      <div style={{ transform: `scale(${octoScale})`, opacity: s }}>
        <Octopus size={240} />
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 96,
          fontWeight: 900,
          letterSpacing: -3,
          opacity: word.opacity,
          transform: word.transform,
        }}
      >
        <span style={{ color: '#fff' }}>Prompt</span>
        <span style={{ color: C.pop400 }}>opus</span>
      </div>

      <div
        style={{
          fontSize: 40,
          fontWeight: 600,
          color: '#cdc7e8',
          opacity: tag.opacity,
          transform: tag.transform,
        }}
      >
        Stop guessing which model to ship.
      </div>

      <div
        style={{
          marginTop: 40,
          padding: '22px 40px',
          borderRadius: 18,
          border: `1px solid ${C.pop400}66`,
          background: '#ffffff0c',
          fontFamily: mono,
          fontSize: 44,
          color: '#fff',
          opacity: cmd,
          transform: `scale(${cmdScale})`,
        }}
      >
        <span style={{ color: C.pop400 }}>$</span> npx promptopus init
      </div>

      <div
        style={{
          marginTop: 34,
          display: 'flex',
          gap: 40,
          fontSize: 32,
          fontFamily: mono,
          color: '#bdb7d6',
          opacity: links.opacity,
          transform: links.transform,
        }}
      >
        <span>promptopus.pages.dev</span>
        <span style={{ color: '#ffffff30' }}>•</span>
        <span>npm i promptopus</span>
      </div>
    </AbsoluteFill>
  );
};
