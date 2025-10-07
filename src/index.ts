import { parse } from './parser.js';
import { createGlobalEnvironment, run } from './interpreter.js';
import { Environment } from './environment.js';
import { Value } from './values.js';

export function evaluateSource(source: string, environment?: Environment): Value {
  const program = parse(source);
  const env = environment ?? createGlobalEnvironment();
  return run(program, env);
}

export { parse, run, createGlobalEnvironment, Environment };
export type { Value } from './values.js';
