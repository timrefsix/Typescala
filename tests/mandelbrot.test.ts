import { describe, expect, it } from 'vitest';
import { evaluateSource } from '../src/index.js';
import type { CanvasValue, Value } from '../src/values.js';

const script = `let width = 60
let height = 40
let maxIterations = 40

let image = canvas(width, height)

for py in 0..height {
  let imaginary = (py / height) * 2.4 - 1.2
  for px in 0..width {
    let real = (px / width) * 3.5 - 2.5
    let zx = 0
    let zy = 0
    let iteration = 0
    let escaped = false
    let escapeCount = maxIterations

    while(() => iteration < maxIterations, () => {
      let xSquared = zx * zx
      let ySquared = zy * zy

      if (xSquared + ySquared > 4) {
        escaped = true
        escapeCount = iteration
        iteration = maxIterations
      } else {
        let twoXY = zx * zy * 2
        let nextX = xSquared - ySquared + real
        zy = twoXY + imaginary
        zx = nextX
        iteration = iteration + 1
      }
    })

    if (escaped) {
      let intensity = (escapeCount / maxIterations) * 255
      setPixel(image, px, py, intensity, intensity, intensity)
    } else {
      setPixel(image, px, py, 0, 0, 0)
    }
  }
}

image`;

const toCanvas = (value: Value): CanvasValue => {
  if (value.kind !== 'canvas') {
    throw new Error(`Expected canvas but received ${value.kind}`);
  }
  return value;
};

describe('mandelbrot rendering script', () => {
  it('returns a populated canvas', () => {
    const result = evaluateSource(script);
    const canvas = toCanvas(result);

    expect(canvas.width).toBe(60);
    expect(canvas.height).toBe(40);

    const pixel = (x: number, y: number) => {
      const index = (y * canvas.width + x) * 4;
      return canvas.pixels.slice(index, index + 4);
    };

    const center = pixel(30, 20);
    expect(Array.from(center)).toEqual([0, 0, 0, 255]);

    const exterior = pixel(55, 6);
    expect(exterior[0]).toBeGreaterThan(0);
    expect(exterior[0]).toBeLessThanOrEqual(255);
    expect(exterior[0]).toBe(exterior[1]);
    expect(exterior[1]).toBe(exterior[2]);
  });
});
