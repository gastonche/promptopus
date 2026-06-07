import { defineConfig } from 'promptopus';

const det = (id, score, passed, detail) => ({ graderId: id, family: 'deterministic', score, passed, detail });

const countSentences = (text) =>
  (text.trim().match(/[^.!?]+[.!?]+(?:\s|$)/g) || []).filter((s) => s.trim().length > 4).length;

export default defineConfig({
  graders: {
    // Enforce ReadAloud's "3–5 sentences" constraint.
    'sentence-count': (spec) => {
      const min = spec.min ?? 3;
      const max = spec.max ?? 5;
      const id = `sentence-count(${min}-${max})`;
      return {
        id,
        family: 'deterministic',
        grade: ({ output }) => {
          const n = countSentences(output.text);
          const passed = n >= min && n <= max;
          return det(id, passed ? 1 : 0, passed, `${n} sentences (want ${min}-${max})`);
        },
      };
    },

    // The product prompt forbids meta-references ("this article", "in summary", …).
    'no-meta-reference': () => {
      const re = /\b(this (?:article|text|content|passage|piece|summary)|the (?:article|text|author|passage|content)|in summary|to summari[sz]e)\b/i;
      return {
        id: 'no-meta-reference',
        family: 'deterministic',
        grade: ({ output }) => {
          const m = output.text.match(re);
          return det('no-meta-reference', m ? 0 : 1, !m, m ? `meta-reference: "${m[0]}"` : 'no meta-references');
        },
      };
    },

    // Reasoning models leak chain-of-thought; a TL;DR must not.
    'no-reasoning-leak': () => {
      const re = /<\/?think>|\b(chain[- ]of[- ]thought)\b|^\s*(?:okay,?\s+(?:so|let)|let me|first,?\s+i|i need to|i'?ll start|alright,)/i;
      return {
        id: 'no-reasoning-leak',
        family: 'deterministic',
        grade: ({ output }) => {
          const bad = re.test(output.text);
          return det('no-reasoning-leak', bad ? 0 : 1, !bad, bad ? 'leaked reasoning / think tokens' : 'clean output');
        },
      };
    },

    // Deterministic faithfulness proxy: every number in the summary must appear in the source.
    'number-fidelity': () => {
      return {
        id: 'number-fidelity',
        family: 'deterministic',
        grade: ({ output, testCase }) => {
          const src = String(testCase.source ?? '').replace(/,/g, '');
          const nums = (output.text.match(/\b\d[\d,]*(?:\.\d+)?\b/g) ?? []).map((x) => x.replace(/,/g, ''));
          const bad = nums.filter((n) => !src.includes(n));
          const passed = bad.length === 0;
          const score = nums.length === 0 ? 1 : Math.max(0, 1 - bad.length / nums.length);
          return det(
            'number-fidelity',
            score,
            passed,
            nums.length === 0 ? 'no numbers' : passed ? `all ${nums.length} numbers grounded` : `ungrounded: ${bad.slice(0, 3).join(', ')}`,
          );
        },
      };
    },

    // Actually summarizing — output should be much shorter than the source.
    compression: (spec) => {
      const maxRatio = spec.maxRatio ?? 0.4;
      const id = `compression(<=${Math.round(maxRatio * 100)}%)`;
      return {
        id,
        family: 'deterministic',
        grade: ({ output, testCase }) => {
          const srcLen = String(testCase.source ?? '').length || 1;
          const ratio = output.text.length / srcLen;
          const passed = ratio <= maxRatio;
          return det(id, passed ? 1 : Math.max(0, maxRatio / ratio), passed, `${Math.round(ratio * 100)}% of source length`);
        },
      };
    },
  },
});
