import { describe, expect, it } from 'vitest';
import { evaluateSource } from '../src/index.js';
import { formatError, formatResult, getDefaultSnippet } from '../src/ui/presentation.js';
import { getDefaultScript } from '../src/ui/snippets.js';
import type { Value } from '../src/values.js';

class FakeValue {
  constructor(private readonly value: string) {}

  toString() {
    return this.value;
  }
}

describe('presentation helpers', () => {
  it('formats primitive results', () => {
    expect(formatResult(42)).toBe('42');
    expect(formatResult('hello')).toBe('hello');
  });

  it('formats objects using toString when available', () => {
    const value = new FakeValue('custom');
    expect(formatResult(value as unknown as Value)).toBe('custom');
  });

  it('formats interpreter values by kind', () => {
    expect(formatResult({ kind: 'number', value: 7 } as Value)).toBe('7');
    expect(formatResult({ kind: 'string', value: 'hi' } as Value)).toBe('hi');
    expect(formatResult({ kind: 'boolean', value: false } as Value)).toBe('false');
    expect(formatResult({ kind: 'null' } as Value)).toBe('null');
    expect(
      formatResult({
        kind: 'function',
        call: () => ({ kind: 'null' } as Value),
        name: 'demo',
      } as Value),
    ).toBe('<function demo>');
    expect(
      formatResult({
        kind: 'function',
        call: () => ({ kind: 'null' } as Value),
      } as Value),
    ).toBe('<function>');
    expect(
      formatResult({
        kind: 'iterator',
        next: () => ({ done: true }),
      } as Value),
    ).toBe('<iterator>');
    expect(
      formatResult({
        kind: 'canvas',
        width: 2,
        height: 3,
        pixels: new Uint8ClampedArray(0),
      } as Value),
    ).toBe('<canvas 2×3>');
  });

  it('formats errors gracefully', () => {
    expect(formatError(new Error('Boom'))).toBe('Error: Boom');
    expect(formatError('bad')).toBe('Error: bad');
  });

  it('provides a default snippet that evaluates successfully', () => {
    const snippet = getDefaultSnippet();
    expect(snippet).not.toContain(';');
    expect(snippet).toBe(getDefaultScript().code);

    const result = evaluateSource(snippet);
    expect(result).toEqual({ kind: 'number', value: 8 });
  });
});
