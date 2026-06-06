const JSON_INSTRUCTION =
  'Respond ONLY with JSON: {"score": <number 0.0-1.0>, "reasoning": "<one short sentence>"}.';

export function faithfulnessPrompt(source: string, output: string): string {
  return [
    'Judge whether the OUTPUT stays faithful to the SOURCE.',
    'A faithful output introduces no facts, names, or numbers absent from the source and never contradicts it.',
    'Score 1.0 = fully grounded; 0.0 = largely fabricated or contradictory.',
    '',
    `SOURCE:\n"""${source}"""`,
    '',
    `OUTPUT:\n"""${output}"""`,
    '',
    JSON_INSTRUCTION,
  ].join('\n');
}

const DEFAULT_QUALITY_RUBRIC =
  'Judge overall quality: correctness, clarity, completeness, and concision.';

export function qualityPrompt(
  taskPrompt: string,
  output: string,
  rubric: string | undefined,
  reference: string | undefined,
): string {
  const lines = [
    'Score the QUALITY of the OUTPUT for the given TASK.',
    rubric ?? DEFAULT_QUALITY_RUBRIC,
    'Score 1.0 = excellent; 0.0 = unusable.',
    '',
    `TASK:\n"""${taskPrompt}"""`,
    '',
    `OUTPUT:\n"""${output}"""`,
  ];
  if (reference !== undefined) {
    lines.push('', `REFERENCE (a strong answer):\n"""${reference}"""`);
  }
  lines.push('', JSON_INSTRUCTION);
  return lines.join('\n');
}
