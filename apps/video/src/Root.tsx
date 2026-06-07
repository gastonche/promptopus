import { Composition } from 'remotion';
import { Speedrun, TOTAL } from './Speedrun';
import { Pitch, PITCH_TOTAL } from './Pitch';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Speedrun"
        component={Speedrun}
        durationInFrames={TOTAL}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{ music: true }}
      />
      <Composition
        id="Pitch"
        component={Pitch}
        durationInFrames={PITCH_TOTAL}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ music: true }}
      />
    </>
  );
};
