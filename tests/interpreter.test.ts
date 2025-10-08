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

  const asIterator = (value: Value) => {
    if (value.kind !== 'iterator') {
      throw new Error(`Expected iterator but received ${value.kind}`);
    }
    return value;
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

  it('compares booleans using the equals operator', () => {
    const result = evaluateSource(`
      true equals true
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

  it('repeats a block while the condition function returns truthy', () => {
    const result = evaluateSource(`
      let counter = 0

      while(() => counter lessThan 3) {
        counter = counter plus 1
      }

      counter
    `);

    expect(asNumber(result)).toBe(3);
  });

  it('returns the last value produced by the loop body', () => {
    const result = evaluateSource(`
      let counter = 0

      while(() => counter lessThan 3) {
        counter = counter plus 1
        counter times 2
      }
    `);

    expect(asNumber(result)).toBe(6);
  });

  it('returns null when the loop body never executes', () => {
    const result = evaluateSource(`
      let counter = 10

      while(() => counter lessThan 3) {
        counter = counter plus 1
      }
    `);

    expect(result.kind).toBe('null');
  });

  it('throws when the condition argument is not a function', () => {
    expect(() =>
      evaluateSource(`
        while(true) {
          null
        }
      `),
    ).toThrow('while expects a function condition');
  });

  it('creates an exclusive range iterator with ..', () => {
    const result = evaluateSource(`0..2`);

    const iterator = asIterator(result);
    const first = iterator.next();
    if (first.done || !first.value) {
      throw new Error('Expected first range value');
    }
    expect(asNumber(first.value)).toBe(0);

    const second = iterator.next();
    if (second.done || !second.value) {
      throw new Error('Expected second range value');
    }
    expect(asNumber(second.value)).toBe(1);
    expect(iterator.next().done).toBe(true);
  });

  it('iterates over a range using a for loop', () => {
    const result = evaluateSource(`
      let sum = 0

      for value in 0..5 {
        sum = sum plus value
      }

      sum
    `);

    expect(asNumber(result)).toBe(10);
  });

  it('supports inclusive ranges with ...', () => {
    const result = evaluateSource(`
      let product = 1

      for number in 1...4 {
        product = product times number
      }

      product
    `);

    expect(asNumber(result)).toBe(24);
  });

  it('throws when the for iterable is not an iterator', () => {
    expect(() =>
      evaluateSource(`
        for value in 10 {
          value
        }
      `),
    ).toThrow('for expects an iterator iterable');
  });
});
