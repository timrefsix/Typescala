import { describe, expect, it } from 'vitest';
import { evaluateSource } from '../src/index.js';
import { demoScripts } from '../src/ui/snippets.js';

describe('demo scripts', () => {
  it('provides at least one script', () => {
    expect(demoScripts.length).toBeGreaterThan(0);
  });

  for (const script of demoScripts) {
    it(`evaluates the ${script.label} example`, () => {
      const result = evaluateSource(script.code);
      expect(result).toEqual(script.expected);
    });
  }
});
