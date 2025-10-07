import type { Value } from '../values.js';
import { getDefaultScript } from './snippets.js';

function isTypescalaValue(value: unknown): value is Value {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    typeof (value as { kind?: unknown }).kind === 'string'
  );
}

export function formatResult(value: unknown): string {
  if (isTypescalaValue(value)) {
    switch (value.kind) {
      case 'number':
        return String(value.value);
      case 'string':
        return value.value;
      case 'boolean':
        return String(value.value);
      case 'null':
        return 'null';
      case 'function':
        return value.name ? `<function ${value.name}>` : '<function>';
      case 'iterator':
        return '<iterator>';
    }
  }

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
  return getDefaultScript().code;
}
