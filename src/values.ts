export type Value =
  | NumberValue
  | StringValue
  | BooleanValue
  | NullValue
  | FunctionValue;

export type ValueKind = Value['kind'];

export interface NumberValue {
  kind: 'number';
  value: number;
}

export interface StringValue {
  kind: 'string';
  value: string;
}

export interface BooleanValue {
  kind: 'boolean';
  value: boolean;
}

export interface NullValue {
  kind: 'null';
}

export interface FunctionValue {
  kind: 'function';
  call(args: Value[], thisArg?: Value): Value;
  readonly name?: string;
}
