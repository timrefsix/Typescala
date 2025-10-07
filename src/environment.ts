import { Value } from './values.js';

export class Environment {
  private values = new Map<string, Value>();

  constructor(private readonly parent?: Environment) {}

  define(name: string, value: Value): void {
    this.values.set(name, value);
  }

  assign(name: string, value: Value): void {
    if (this.values.has(name)) {
      this.values.set(name, value);
      return;
    }
    if (this.parent) {
      this.parent.assign(name, value);
      return;
    }
    throw new Error(`Undefined variable ${name}`);
  }

  get(name: string): Value {
    if (this.values.has(name)) {
      return this.values.get(name)!;
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new Error(`Undefined variable ${name}`);
  }
}
