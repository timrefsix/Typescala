import type { Value, ValueKind } from '../values.js';

export type DemoScript = {
  id: string;
  label: string;
  description: string;
  code: string;
  expected?: Value;
  expectedKind?: ValueKind;
};

export const demoScripts: readonly DemoScript[] = [
  {
    id: 'fibonacci',
    label: 'Recursive Fibonacci',
    description: 'Computes the sixth Fibonacci number using a classic recursive definition.',
    code: `let fib = (n) => {
  if (n <= 1) {
    n
  } else {
    fib(n - 1) + fib(n - 2)
  }
}

fib(6)`,
    expected: { kind: 'number', value: 8 },
  },
  {
    id: 'factorial',
    label: 'Factorial',
    description: 'Uses recursion to calculate 5! (factorial of five).',
    code: `let factorial = (n) => {
  if (n <= 1) {
    1
  } else {
    n * factorial(n - 1)
  }
}

factorial(5)`,
    expected: { kind: 'number', value: 120 },
  },
  {
    id: 'range-sum',
    label: 'Range Summation',
    description: 'Adds the numbers from one through ten with a for-loop and inclusive range.',
    code: `let total = 0

for number in 1...10 {
  total = total + number
}

total`,
    expected: { kind: 'number', value: 55 },
  },
  {
    id: 'closure-counter',
    label: 'Closure Counter',
    description: 'Captures a mutable binding inside a closure and increments it twice.',
    code: `let makeCounter = (start) => {
  let current = start
  () => {
    current = current + 1
    current
  }
}

let counter = makeCounter(5)
counter()
counter()`,
    expected: { kind: 'number', value: 7 },
  },
  {
    id: 'while-doubling',
    label: 'While Loop Doubling',
    description: 'Doubles a value five times using the built-in while helper.',
    code: `let counter = 0
let value = 1

while(() => counter < 5, () => {
  counter = counter + 1
  value = value * 2
  value
})

value`,
    expected: { kind: 'number', value: 32 },
  },
  {
    id: 'mandelbrot-canvas',
    label: 'Mandelbrot Canvas',
    description: 'Plots the Mandelbrot set into a canvas using the native drawing helpers.',
    code: `let width = 60
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

image`,
    expectedKind: 'canvas',
  },
];

export const CUSTOM_SCRIPT_ID = 'custom';

export function findScriptById(id: string): DemoScript | undefined {
  return demoScripts.find((script) => script.id === id);
}

export function findScriptByCode(code: string): DemoScript | undefined {
  return demoScripts.find((script) => script.code === code);
}

export function getDefaultScript(): DemoScript {
  return demoScripts[0];
}
