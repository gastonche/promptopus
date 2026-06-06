import { describe, expect, it } from 'vitest';

import { interpolate, referencedVars, TemplateError } from './templating.js';

describe('interpolate', () => {
  it('substitutes known variables', () => {
    expect(interpolate('Capital of {{country}}?', { country: 'France' })).toBe(
      'Capital of France?',
    );
  });

  it('stringifies non-string values', () => {
    expect(interpolate('{{n}} items, paid={{paid}}', { n: 3, paid: true })).toBe(
      '3 items, paid=true',
    );
  });

  it('tolerates internal whitespace in the tag', () => {
    expect(interpolate('{{  name  }}', { name: 'x' })).toBe('x');
  });

  it('throws a friendly TemplateError on a missing variable', () => {
    expect(() => interpolate('Hi {{who}}', { name: 'x' })).toThrowError(TemplateError);
    expect(() => interpolate('Hi {{who}}', { name: 'x' })).toThrow(/available: name/);
  });
});

describe('referencedVars', () => {
  it('lists referenced names, de-duplicated and in order', () => {
    expect(referencedVars('{{a}} {{b}} {{a}}')).toEqual(['a', 'b']);
  });
});
