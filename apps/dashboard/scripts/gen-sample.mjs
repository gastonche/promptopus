import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { buildReport } from 'promptopus';

const here = dirname(fileURLToPath(import.meta.url));

const PROVIDERS = [
  { name: 'gpt-4o-mini', model: 'gpt-4o-mini' },
  { name: 'haiku', model: 'claude-3-5-haiku-latest' },
  { name: 'llama-8b', model: '@cf/meta/llama-3.1-8b-instruct' },
];

const CASES = [
  {
    id: 'eiffel',
    prompt: 'Summarize the source in 3-5 sentences of plain prose.',
    source:
      'The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris. It is named after engineer Gustave Eiffel, whose company designed and built the tower from 1887 to 1889 as the centerpiece of the 1889 World’s Fair.',
    reference:
      'A wrought-iron tower in Paris, built 1887–1889 by Gustave Eiffel for the 1889 World’s Fair.',
  },
  {
    id: 'photosynthesis',
    prompt: 'Summarize the source in 3-5 sentences of plain prose.',
    source:
      'Photosynthesis is the process by which green plants, algae, and some bacteria convert light energy into chemical energy. Using chlorophyll, they transform carbon dioxide and water into glucose and oxygen. The process underpins nearly all food chains on Earth.',
    reference:
      'Plants and some microbes use chlorophyll to turn CO2, water, and light into glucose and oxygen.',
  },
  {
    id: 'markets',
    prompt: 'Summarize the source in 3-5 sentences of plain prose.',
    source:
      'Global markets rose modestly on Tuesday as investors weighed cooling inflation data against signals from central banks. Technology shares led gains, while energy lagged on softer crude prices. Analysts cautioned that volatility could return ahead of next week’s rate decision.',
    reference:
      'Markets edged up on cooling inflation; tech led, energy lagged, with caution before a rate decision.',
  },
];

function grader(graderId, family, score, passed, detail) {
  return { graderId, family, score, passed, detail };
}

// per (case,provider) tuned outputs so the matrix shows clear winners/losers
const PROFILE = {
  'gpt-4o-mini': {
    latency: [780, 910, 850],
    cost: 0.00062,
    tokInOut: [620, 96],
    faith: 0.9,
    quality: 0.88,
    len: 410,
  },
  haiku: {
    latency: [1480, 1720, 1610],
    cost: 0.00131,
    tokInOut: [640, 102],
    faith: 0.95,
    quality: 0.93,
    len: 430,
  },
  'llama-8b': {
    latency: [640, 720, 690],
    cost: 0.00006,
    tokInOut: [630, 120],
    faith: 0.74,
    quality: 0.69,
    len: 560,
  },
};

const SUMMARIES = {
  'gpt-4o-mini': {
    eiffel:
      'The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris. Engineer Gustave Eiffel’s company designed and built it between 1887 and 1889. It served as the centerpiece of the 1889 World’s Fair.',
    photosynthesis:
      'Photosynthesis lets green plants, algae, and some bacteria turn light into chemical energy. With chlorophyll, they convert carbon dioxide and water into glucose and oxygen. It underpins nearly all of Earth’s food chains.',
    markets:
      'Global markets rose modestly as investors weighed cooling inflation against central-bank signals. Technology shares led while energy lagged on softer crude. Analysts warned volatility may return before next week’s rate decision.',
  },
  haiku: {
    eiffel:
      'Built between 1887 and 1889 by Gustave Eiffel’s company, the Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris. It was the centerpiece of the 1889 World’s Fair and is named after the engineer.',
    photosynthesis:
      'Photosynthesis is how green plants, algae, and some bacteria convert light energy into chemical energy. Using chlorophyll, they transform carbon dioxide and water into glucose and oxygen, a process that underpins nearly all food chains.',
    markets:
      'Markets edged higher as cooling inflation was balanced against central-bank signals. Technology stocks led the gains while energy slipped on weaker crude prices. Analysts cautioned that volatility could return ahead of next week’s rate decision.',
  },
  'llama-8b': {
    eiffel:
      'The Eiffel Tower is a famous iron tower in Paris, France. It was built by Gustave Eiffel in the late 1800s for a World’s Fair and is one of the most visited monuments in the world, attracting millions of tourists every single year.',
    photosynthesis:
      'Photosynthesis is when plants make food from sunlight. They use chlorophyll to turn carbon dioxide and water into sugar and oxygen. This is very important for life on Earth and helps animals breathe and survive every day.',
    markets:
      'Stocks went up a little on Tuesday because inflation is cooling down. Tech companies did well but energy did not. Some experts think prices might move a lot before the big interest rate meeting that is coming up next week soon.',
  },
};

const results = [];
CASES.forEach((c, ci) => {
  PROVIDERS.forEach((p) => {
    const prof = PROFILE[p.name];
    const text = SUMMARIES[p.name][c.id];
    const latencyMs = prof.latency[ci % prof.latency.length];
    const [tokensIn, tokensOut] = prof.tokInOut;
    const costUsd = prof.cost;
    const lenOk = text.length <= 520;
    const faithPass = prof.faith >= 0.7;
    const qualityPass = prof.quality >= 0.7;
    results.push({
      caseId: c.id,
      providerName: p.name,
      status: 'ok',
      output: { text, tokensIn, tokensOut, latencyMs, costUsd },
      graderResults: [
        grader('non-empty', 'deterministic', 1, true, `output has ${text.length} chars`),
        grader(
          'max-length(520)',
          'deterministic',
          lenOk ? 1 : 0,
          lenOk,
          `${text.length}/520 chars`,
        ),
        grader(
          'judge-faithfulness(>=0.7)',
          'judge',
          prof.faith,
          faithPass,
          faithPass ? 'stays grounded in the source' : 'adds details not in the source',
        ),
        grader(
          'judge-quality(>=0.7)',
          'judge',
          prof.quality,
          qualityPass,
          qualityPass ? 'clear and complete' : 'wordy and informal',
        ),
        grader(
          'latency-budget(3000ms)',
          'benchmark',
          latencyMs <= 3000 ? 1 : 0,
          latencyMs <= 3000,
          `${latencyMs}ms vs 3000ms budget`,
        ),
      ],
    });
  });
});

const suite = { name: 'ReadAloud Summarizer (sample)', cases: CASES, providers: PROVIDERS };
const report = buildReport(suite, PROVIDERS, results, '2026-06-06T12:00:00.000Z');

const outDir = resolve(here, '..', 'public');
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'sample-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log('wrote public/sample-report.json');
