import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C } from '../theme';
import { CodeCard, Tok } from '../components/CodeCard';
import { SceneLabel } from '../components/SceneLabel';
import { fadeUp } from '../lib/anim';

const G = '#7dd3fc';
const K = C.pop400;
const S = '#a5f3b0';
const D = '#8b86a8';

const LINES: React.ReactNode[] = [
  <><Tok c={K}>name</Tok>: ReadAloud Summarizer</>,
  <><Tok c={K}>judge</Tok>: {'{'} provider: openai, model: gpt-4o {'}'}</>,
  <><Tok c={K}>providers</Tok>:</>,
  <>  - {'{'} name: <Tok c={S}>gpt-4o-mini</Tok>, kind: openai {'}'}</>,
  <>  - {'{'} name: <Tok c={S}>llama-8b</Tok>, kind: openai-compat {'}'}</>,
  <><Tok c={K}>defaults</Tok>:</>,
  <>  graders:</>,
  <>    - {'{'} type: <Tok c={G}>non-empty</Tok> {'}'}</>,
  <>    - {'{'} type: <Tok c={G}>judge-faithfulness</Tok>, threshold: 0.7 {'}'}</>,
  <>    - {'{'} type: <Tok c={G}>cost-budget</Tok>, maxUsd: 0.002 {'}'}</>,
];

export const MontageYaml: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <SceneLabel num="01" text="Define" />
      <CodeCard title="suite.yaml" fontSize={27} style={{ width: 968 }}>
        {LINES.map((line, i) => {
          const a = fadeUp(frame, 12 + i * 5, 10, 14);
          return (
            <div key={i} style={{ opacity: a.opacity, transform: a.transform }}>
              <Tok c={D}>{line}</Tok>
            </div>
          );
        })}
      </CodeCard>
    </AbsoluteFill>
  );
};
