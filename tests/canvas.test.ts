import { describe, expect, it } from 'vitest';
import { evaluateSource } from '../src/index.js';
import type { CanvasValue, Value } from '../src/values.js';

const asCanvas = (value: Value): CanvasValue => {
  if (value.kind !== 'canvas') {
    throw new Error(`Expected canvas but received ${value.kind}`);
  }
  return value;
};

describe('canvas helpers', () => {
  it('creates canvases with opaque default pixels', () => {
    const result = evaluateSource(`
      let img = canvas(3, 2)
      img
    `);

    const canvas = asCanvas(result);
    expect(canvas.width).toBe(3);
    expect(canvas.height).toBe(2);
    expect(canvas.pixels.length).toBe(3 * 2 * 4);
    for (let index = 3; index < canvas.pixels.length; index += 4) {
      expect(canvas.pixels[index]).toBe(255);
    }
  });

  it('exposes the width and height through helper functions', () => {
    const result = evaluateSource(`
      let img = canvas(4, 5)
      canvasWidth(img) + canvasHeight(img)
    `);

    expect(result).toEqual({ kind: 'number', value: 9 });
  });

  it('fills and updates pixels using fillCanvas and setPixel', () => {
    const result = evaluateSource(`
      let img = canvas(2, 1)
      fillCanvas(img, 10, 20, 30, 40)
      setPixel(img, 1, 0, 90, 80, 70, 60)
      img
    `);

    const canvas = asCanvas(result);
    expect(Array.from(canvas.pixels)).toEqual([10, 20, 30, 40, 90, 80, 70, 60]);
  });

  it('clamps pixel channel values before writing', () => {
    const result = evaluateSource(`
      let img = canvas(1, 1)
      setPixel(img, 0, 0, 300, 0 - 20, 127.6)
      img
    `);

    const canvas = asCanvas(result);
    expect(Array.from(canvas.pixels)).toEqual([255, 0, 128, 255]);
  });

  it('throws when setting a pixel out of bounds', () => {
    expect(() =>
      evaluateSource(`
        let img = canvas(2, 2)
        setPixel(img, 4, 1, 0, 0, 0)
      `),
    ).toThrow('setPixel coordinate is out of bounds');
  });

  it('rejects invalid canvas dimensions', () => {
    expect(() => evaluateSource('canvas(0, 5)')).toThrow(
      'canvas width and height must be positive integers',
    );
    expect(() => evaluateSource('canvas(10, 0 - 3)')).toThrow(
      'canvas width and height must be positive integers',
    );
  });
});
