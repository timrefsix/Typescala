import { describe, expect, it } from 'vitest';
import { evaluateSource } from '../src/index.js';
import { Value } from '../src/values.js';

describe('Typescala interpreter', () => {
  const asNumber = (value: Value): number => {
    if (value.kind !== 'number') {
      throw new Error(`Expected number but received ${value.kind}`);
    }
    return value.value;
  };

  const asBoolean = (value: Value): boolean => {
    if (value.kind !== 'boolean') {
      throw new Error(`Expected boolean but received ${value.kind}`);
    }
    return value.value;
  };

  it('evaluates infix operator calls as method invocations', () => {
    const result = evaluateSource(`
      let total = 1 plus 2
      total times 3
    `);

    expect(asNumber(result)).toBe(9);
  });

  it('allows defining and invoking functions', () => {
    const result = evaluateSource(`
      let add = (a, b) => {
        a plus b
      }

      add(10, 5)
    `);

    expect(asNumber(result)).toBe(15);
  });

  it('supports pseudo keywords with trailing blocks', () => {
    const result = evaluateSource(`
      let unless = (condition, block) => {
        if condition {
          null
        } else {
          block()
        }
      }

      let counter = 0

      unless(counter equals 0) {
        counter = counter plus 10
      }

      counter = counter plus 1

      unless(counter equals 0) {
        counter = counter plus 10
      }

      counter
    `);

    expect(asNumber(result)).toBe(11);
  });

  it('supports inline if expressions without braces', () => {
    const result = evaluateSource(`
      if (1 <= 2) 42 else 0
    `);

    expect(asNumber(result)).toBe(42);
  });

  it('evaluates punctuation subtraction operator', () => {
    const result = evaluateSource(`
      10 - 3
    `);

    expect(asNumber(result)).toBe(7);
  });

  it('evaluates less-than-or-equal comparisons with punctuation syntax', () => {
    const result = evaluateSource(`
      2 <= 2
    `);

    expect(asBoolean(result)).toBe(true);
  });

  it('evaluates the fibonacci script end-to-end', () => {
    const result = evaluateSource(`
      let fib = (n) =>
        if (n <= 1) n else fib(n - 1) + fib(n - 2)

      fib(6)
    `);

    expect(asNumber(result)).toBe(8);
  });
});
