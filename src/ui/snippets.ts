import type { Value } from '../values.js';

export type DemoScript = {
  id: string;
  label: string;
  description: string;
  code: string;
  expected: Value;
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
