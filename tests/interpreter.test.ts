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
});
