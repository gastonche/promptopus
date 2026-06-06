const enabled = process.stdout.isTTY === true && !process.env['NO_COLOR'];

const ESC = String.fromCharCode(27);

function wrap(open: number, close: number) {
  return (s: string): string => (enabled ? `${ESC}[${open}m${s}${ESC}[${close}m` : s);
}

export const style = {
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  purple: wrap(35, 39),
  cyan: wrap(36, 39),
};

export const symbols = {
  ok: style.green('✓'),
  fail: style.red('✗'),
  warn: style.yellow('!'),
  bullet: style.dim('•'),
  octopus: '\u{1F419}',
};

export function note(line = ''): void {
  process.stderr.write(`${line}\n`);
}
