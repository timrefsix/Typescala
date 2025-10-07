import {
  BooleanValue,
  FunctionValue,
  NullValue,
  NumberValue,
  StringValue,
  Value,
  ValueKind,
} from './values.js';

type NativeImplementation = (args: Value[], thisArg?: Value) => Value;

export class NativeFunctionValue implements FunctionValue {
  readonly kind = 'function';

  constructor(
    private readonly implementation: NativeImplementation,
    readonly name?: string,
  ) {}

  call(args: Value[], thisArg?: Value): Value {
    return this.implementation(args, thisArg);
  }
}

export const NULL_VALUE: NullValue = { kind: 'null' };

export function makeNumber(value: number): NumberValue {
  return { kind: 'number', value };
}

export function makeString(value: string): StringValue {
  return { kind: 'string', value };
}

export function makeBoolean(value: boolean): BooleanValue {
  return { kind: 'boolean', value };
}

const methodRegistry: Record<Exclude<ValueKind, 'null'>, Map<string, FunctionValue>> = {
  number: new Map(),
  string: new Map(),
  boolean: new Map(),
  function: new Map(),
};

export function registerMethod(
  kind: Exclude<ValueKind, 'null'>,
  name: string,
  fn: FunctionValue,
): void {
  methodRegistry[kind].set(name, fn);
}

export function lookupMethod(value: Value, name: string): FunctionValue | undefined {
  switch (value.kind) {
    case 'number':
      return methodRegistry.number.get(name);
    case 'string':
      return methodRegistry.string.get(name);
    case 'boolean':
      return methodRegistry.boolean.get(name);
    case 'function':
      return methodRegistry.function.get(name);
    default:
      return undefined;
  }
}

export function isTruthy(value: Value): boolean {
  switch (value.kind) {
    case 'null':
      return false;
    case 'boolean':
      return value.value;
    case 'number':
      return value.value !== 0;
    case 'string':
      return value.value.length > 0;
    case 'function':
      return true;
  }
}

export function expectNumber(value: Value, message: string): number {
  if (value.kind !== 'number') {
    throw new Error(message);
  }
  return value.value;
}

export function expectBoolean(value: Value, message: string): boolean {
  if (value.kind !== 'boolean') {
    throw new Error(message);
  }
  return value.value;
}

export function cloneValue(value: Value): Value {
  switch (value.kind) {
    case 'number':
      return makeNumber(value.value);
    case 'string':
      return makeString(value.value);
    case 'boolean':
      return makeBoolean(value.value);
    case 'null':
      return NULL_VALUE;
    case 'function':
      return value;
  }
}
