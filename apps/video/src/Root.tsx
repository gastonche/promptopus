import { Composition } from 'remotion';
import { Speedrun, TOTAL } from './Speedrun';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Speedrun"
      component={Speedrun}
      durationInFrames={TOTAL}
      fps={30}
      width={1080}
      height={1080}
      defaultProps={{ music: true }}
    />
  );
};
