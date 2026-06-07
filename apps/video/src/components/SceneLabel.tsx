import { useCurrentFrame } from 'remotion';
import { C } from '../theme';
import { mono } from '../fonts';
import { fadeUp } from '../lib/anim';

export const SceneLabel: React.FC<{ num: string; text: string }> = ({ num, text }) => {
  const frame = useCurrentFrame();
  const a = fadeUp(frame, 2, 12, 16);
  return (
    <div
      style={{
        position: 'absolute',
        top: 70,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: mono,
        fontSize: 30,
        letterSpacing: 4,
        textTransform: 'uppercase',
        opacity: a.opacity,
        transform: a.transform,
      }}
    >
      <span style={{ color: C.pop400, fontWeight: 700 }}>{num}</span>
      <span style={{ color: '#ffffff40' }}> — </span>
      <span style={{ color: '#cdc7e8' }}>{text}</span>
    </div>
  );
};
