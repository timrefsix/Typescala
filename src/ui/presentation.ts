import type { Value } from '../values.js';

export function formatResult(value: Value): string {
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    try {
      return String(value.toString());
    } catch (error) {
      return `Result: ${JSON.stringify(value)}`;
    }
  }

  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }

  return `Error: ${String(error)}`;
}

export function getDefaultSnippet(): string {
  return `let fib = (n) => {
  if (n <= 1) {
    n
  } else {
    fib(n - 1) + fib(n - 2)
  }
};

fib(6);`;
}
