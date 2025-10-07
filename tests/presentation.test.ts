import { describe, expect, it } from 'vitest';
import { formatError, formatResult, getDefaultSnippet } from '../src/ui/presentation.js';
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

  it('formats errors gracefully', () => {
    expect(formatError(new Error('Boom'))).toBe('Error: Boom');
    expect(formatError('bad')).toBe('Error: bad');
  });

  it('provides a default snippet that is never empty', () => {
    expect(getDefaultSnippet().length).toBeGreaterThan(0);
  });
});
