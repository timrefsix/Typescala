import {
  AssignmentStatement,
  BlockExpression,
  BlockFunctionExpression,
  CallExpression,
  Expression,
  ForStatement,
  FunctionExpression,
  IfExpression,
  InfixExpression,
  LetStatement,
  Program,
  Statement,
} from './ast.js';
import { Environment } from './environment.js';
import {
  NativeFunctionValue,
  NULL_VALUE,
  cloneValue,
  expectBoolean,
  expectCanvas,
  expectIterator,
  expectNumber,
  isTruthy,
  lookupMethod,
  makeBoolean,
  makeIterator,
  makeCanvas,
  makeNumber,
  makeString,
  registerMethod,
} from './runtime.js';
import { FunctionValue, IteratorValue, Value } from './values.js';

class UserFunctionValue implements FunctionValue {
  readonly kind = 'function';

  constructor(
    private readonly params: string[],
    private readonly body: BlockExpression,
    private readonly closure: Environment,
    readonly name?: string,
  ) {}

  call(args: Value[], thisArg?: Value): Value {
    const fnEnv = new Environment(this.closure);
    if (thisArg) {
      fnEnv.define('self', thisArg);
    }
    this.params.forEach((param, index) => {
      fnEnv.define(param, args[index] ?? NULL_VALUE);
    });
    return evaluateBlock(this.body, fnEnv);
  }
}

function evaluateProgram(program: Program, environment: Environment): Value {
  let result: Value = NULL_VALUE;
  for (const statement of program.statements) {
    result = evaluateStatement(statement, environment);
  }
  return result;
}

function evaluateStatement(statement: Statement, environment: Environment): Value {
  switch (statement.type) {
    case 'let':
      return evaluateLet(statement, environment);
    case 'assignment':
      return evaluateAssignment(statement, environment);
    case 'for':
      return evaluateForStatement(statement, environment);
    case 'expression':
      return evaluateExpression(statement.expression, environment);
  }
}

function evaluateLet(statement: LetStatement, environment: Environment): Value {
  const value = evaluateExpression(statement.value, environment);
  environment.define(statement.name, value);
  return value;
}

function evaluateAssignment(statement: AssignmentStatement, environment: Environment): Value {
  const value = evaluateExpression(statement.value, environment);
  environment.assign(statement.name, value);
  return value;
}

function evaluateForStatement(statement: ForStatement, environment: Environment): Value {
  const iterable = evaluateExpression(statement.iterable, environment);
  const iterator = expectIterator(iterable, 'for expects an iterator iterable');
  const loopEnv = new Environment(environment);
  loopEnv.define(statement.iterator, NULL_VALUE);
  let result: Value = NULL_VALUE;

  while (true) {
    const step = iterator.next();
    if (step.done) {
      return result;
    }
    const value = step.value ? cloneValue(step.value) : NULL_VALUE;
    loopEnv.assign(statement.iterator, value);
    result = evaluateBlock(statement.body, new Environment(loopEnv));
  }
}

function evaluateExpression(expression: Expression, environment: Environment): Value {
  switch (expression.type) {
    case 'number':
      return makeNumber(expression.value);
    case 'string':
      return makeString(expression.value);
    case 'boolean':
      return makeBoolean(expression.value);
    case 'null':
      return NULL_VALUE;
    case 'identifier':
      return cloneValue(environment.get(expression.name));
    case 'function':
      return createUserFunction(expression, environment);
    case 'call':
      return evaluateCallExpression(expression, environment);
    case 'block':
      return evaluateBlock(expression, new Environment(environment));
    case 'blockFunction':
      return createBlockFunction(expression, environment);
    case 'if':
      return evaluateIfExpression(expression, environment);
    case 'infix':
      return evaluateInfixExpression(expression, environment);
  }
}

function createUserFunction(expression: FunctionExpression, environment: Environment): Value {
  return new UserFunctionValue(expression.params, expression.body, environment);
}

function createBlockFunction(expression: BlockFunctionExpression, environment: Environment): Value {
  return new UserFunctionValue([], expression.block, environment);
}

function evaluateCallExpression(expression: CallExpression, environment: Environment): Value {
  const callee = evaluateExpression(expression.callee, environment);
  if (callee.kind !== 'function') {
    throw new Error('Attempted to call a non-function value');
  }
  const args = expression.args.map((arg) => evaluateExpression(arg, environment));
  return callee.call(args);
}

function evaluateBlock(block: BlockExpression, environment: Environment): Value {
  let result: Value = NULL_VALUE;
  for (const statement of block.statements) {
    result = evaluateStatement(statement, environment);
  }
  return result;
}

function evaluateIfExpression(expression: IfExpression, environment: Environment): Value {
  const condition = evaluateExpression(expression.condition, environment);
  if (isTruthy(condition)) {
    return evaluateBlock(expression.thenBranch, new Environment(environment));
  }
  if (expression.elseBranch) {
    return evaluateBlock(expression.elseBranch, new Environment(environment));
  }
  return NULL_VALUE;
}

function evaluateInfixExpression(expression: InfixExpression, environment: Environment): Value {
  const left = evaluateExpression(expression.left, environment);
  const right = evaluateExpression(expression.right, environment);
  const method = lookupMethod(left, expression.operator);
  if (!method) {
    throw new Error(`Unknown operator ${expression.operator} for ${left.kind}`);
  }
  return method.call([right], left);
}

function createRangeIterator(start: number, end: number, inclusive: boolean): IteratorValue {
  const step = start <= end ? 1 : -1;
  let current = start;
  return makeIterator(() => {
    if (step > 0) {
      if (inclusive ? current > end : current >= end) {
        return { done: true };
      }
    } else if (inclusive ? current < end : current <= end) {
      return { done: true };
    }
    const value = makeNumber(current);
    current += step;
    return { done: false, value };
  });
}

function createGlobalEnvironment(): Environment {
  const env = new Environment();

  registerMethod(
    'number',
    'plus',
    new NativeFunctionValue(([other], self) => {
      const left = expectNumber(self!, 'plus expects a number as the receiver');
      const right = expectNumber(other ?? NULL_VALUE, 'plus expects a number argument');
      return makeNumber(left + right);
    }, 'plus'),
  );

  registerMethod(
    'number',
    'minus',
    new NativeFunctionValue(([other], self) => {
      const left = expectNumber(self!, 'minus expects a number as the receiver');
      const right = expectNumber(other ?? NULL_VALUE, 'minus expects a number argument');
      return makeNumber(left - right);
    }, 'minus'),
  );

  registerMethod(
    'number',
    'times',
    new NativeFunctionValue(([other], self) => {
      const left = expectNumber(self!, 'times expects a number as the receiver');
      const right = expectNumber(other ?? NULL_VALUE, 'times expects a number argument');
      return makeNumber(left * right);
    }, 'times'),
  );

  registerMethod(
    'number',
    'dividedBy',
    new NativeFunctionValue(([other], self) => {
      const left = expectNumber(self!, 'dividedBy expects a number as the receiver');
      const right = expectNumber(other ?? NULL_VALUE, 'dividedBy expects a number argument');
      return makeNumber(left / right);
    }, 'dividedBy'),
  );

  registerMethod(
    'number',
    'rangeExclusive',
    new NativeFunctionValue(([other], self) => {
      const start = expectNumber(self!, 'rangeExclusive expects a number receiver');
      const end = expectNumber(other ?? NULL_VALUE, 'rangeExclusive expects a number argument');
      return createRangeIterator(start, end, false);
    }, 'rangeExclusive'),
  );

  registerMethod(
    'number',
    'rangeInclusive',
    new NativeFunctionValue(([other], self) => {
      const start = expectNumber(self!, 'rangeInclusive expects a number receiver');
      const end = expectNumber(other ?? NULL_VALUE, 'rangeInclusive expects a number argument');
      return createRangeIterator(start, end, true);
    }, 'rangeInclusive'),
  );

  registerMethod(
    'number',
    'equals',
    new NativeFunctionValue(([other], self) => {
      const left = expectNumber(self!, 'equals expects a number as the receiver');
      const right = expectNumber(other ?? NULL_VALUE, 'equals expects a number argument');
      return makeBoolean(left === right);
    }, 'equals'),
  );

  registerMethod(
    'number',
    'lessThan',
    new NativeFunctionValue(([other], self) => {
      const left = expectNumber(self!, 'lessThan expects a number as the receiver');
      const right = expectNumber(other ?? NULL_VALUE, 'lessThan expects a number argument');
      return makeBoolean(left < right);
    }, 'lessThan'),
  );

  registerMethod(
    'number',
    'lessThanOrEqual',
    new NativeFunctionValue(([other], self) => {
      const left = expectNumber(self!, 'lessThanOrEqual expects a number as the receiver');
      const right = expectNumber(other ?? NULL_VALUE, 'lessThanOrEqual expects a number argument');
      return makeBoolean(left <= right);
    }, 'lessThanOrEqual'),
  );

  registerMethod(
    'number',
    'greaterThan',
    new NativeFunctionValue(([other], self) => {
      const left = expectNumber(self!, 'greaterThan expects a number as the receiver');
      const right = expectNumber(other ?? NULL_VALUE, 'greaterThan expects a number argument');
      return makeBoolean(left > right);
    }, 'greaterThan'),
  );

  registerMethod(
    'number',
    'greaterThanOrEqual',
    new NativeFunctionValue(([other], self) => {
      const left = expectNumber(self!, 'greaterThanOrEqual expects a number as the receiver');
      const right = expectNumber(other ?? NULL_VALUE, 'greaterThanOrEqual expects a number argument');
      return makeBoolean(left >= right);
    }, 'greaterThanOrEqual'),
  );

  registerMethod(
    'string',
    'plus',
    new NativeFunctionValue(([other], self) => {
      if (!self || self.kind !== 'string') {
        throw new Error('plus expects a string receiver');
      }
      const value =
        other?.kind === 'string'
          ? other.value
          : other?.kind === 'number'
            ? String(other.value)
            : other?.kind === 'boolean'
              ? String(other.value)
              : '';
      return makeString(self.value + value);
    }, 'plus'),
  );

  registerMethod(
    'boolean',
    'and',
    new NativeFunctionValue(([other], self) => {
      const left = expectBoolean(self!, 'and expects a boolean receiver');
      const right = expectBoolean(other ?? NULL_VALUE, 'and expects a boolean argument');
      return makeBoolean(left && right);
    }, 'and'),
  );

  registerMethod(
    'boolean',
    'or',
    new NativeFunctionValue(([other], self) => {
      const left = expectBoolean(self!, 'or expects a boolean receiver');
      const right = expectBoolean(other ?? NULL_VALUE, 'or expects a boolean argument');
      return makeBoolean(left || right);
    }, 'or'),
  );

  registerMethod(
    'boolean',
    'equals',
    new NativeFunctionValue(([other], self) => {
      const left = expectBoolean(self!, 'equals expects a boolean receiver');
      const right = expectBoolean(other ?? NULL_VALUE, 'equals expects a boolean argument');
      return makeBoolean(left === right);
    }, 'equals'),
  );

  env.define('true', makeBoolean(true));
  env.define('false', makeBoolean(false));
  env.define('null', NULL_VALUE);

  env.define(
    'print',
    new NativeFunctionValue(([value]) => {
      if (value?.kind === 'string') {
        console.log(value.value);
      } else if (value?.kind === 'number') {
        console.log(value.value);
      } else if (value?.kind === 'boolean') {
        console.log(value.value);
      } else {
        console.log('null');
      }
      return NULL_VALUE;
    }, 'print'),
  );

  env.define(
    'while',
    new NativeFunctionValue(([condition, block]) => {
      if (!condition || condition.kind !== 'function') {
        throw new Error('while expects a function condition');
      }
      if (!block || block.kind !== 'function') {
        throw new Error('while expects a function block');
      }

      let result: Value = NULL_VALUE;
      while (true) {
        const conditionResult = condition.call([]);
        if (!isTruthy(conditionResult)) {
          return result;
        }
        result = block.call([]);
      }
    }, 'while'),
  );

  env.define(
    'canvas',
    new NativeFunctionValue(([width, height]) => {
      const w = expectNumber(width ?? NULL_VALUE, 'canvas expects a width argument');
      const h = expectNumber(height ?? NULL_VALUE, 'canvas expects a height argument');
      return makeCanvas(w, h);
    }, 'canvas'),
  );

  env.define(
    'canvasWidth',
    new NativeFunctionValue(([canvasValue]) => {
      const canvas = expectCanvas(canvasValue ?? NULL_VALUE, 'canvasWidth expects a canvas');
      return makeNumber(canvas.width);
    }, 'canvasWidth'),
  );

  env.define(
    'canvasHeight',
    new NativeFunctionValue(([canvasValue]) => {
      const canvas = expectCanvas(canvasValue ?? NULL_VALUE, 'canvasHeight expects a canvas');
      return makeNumber(canvas.height);
    }, 'canvasHeight'),
  );

  env.define(
    'fillCanvas',
    new NativeFunctionValue(([canvasValue, red, green, blue, alpha]) => {
      const canvas = expectCanvas(canvasValue ?? NULL_VALUE, 'fillCanvas expects a canvas');
      const r = Math.max(0, Math.min(255, Math.round(expectNumber(red ?? NULL_VALUE, 'fillCanvas expects a red channel value'))));
      const g = Math.max(
        0,
        Math.min(255, Math.round(expectNumber(green ?? NULL_VALUE, 'fillCanvas expects a green channel value'))),
      );
      const b = Math.max(
        0,
        Math.min(255, Math.round(expectNumber(blue ?? NULL_VALUE, 'fillCanvas expects a blue channel value'))),
      );
      const a = alpha !== undefined
        ? Math.max(
            0,
            Math.min(255, Math.round(expectNumber(alpha, 'fillCanvas expects an alpha channel value'))),
          )
        : 255;
      for (let index = 0; index < canvas.pixels.length; index += 4) {
        canvas.pixels[index] = r;
        canvas.pixels[index + 1] = g;
        canvas.pixels[index + 2] = b;
        canvas.pixels[index + 3] = a;
      }
      return canvas;
    }, 'fillCanvas'),
  );

  env.define(
    'setPixel',
    new NativeFunctionValue(([canvasValue, xValue, yValue, red, green, blue, alpha]) => {
      const canvas = expectCanvas(canvasValue ?? NULL_VALUE, 'setPixel expects a canvas as the first argument');
      const x = Math.floor(expectNumber(xValue ?? NULL_VALUE, 'setPixel expects an x coordinate'));
      const y = Math.floor(expectNumber(yValue ?? NULL_VALUE, 'setPixel expects a y coordinate'));
      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
        throw new Error('setPixel coordinate is out of bounds');
      }
      const r = Math.max(0, Math.min(255, Math.round(expectNumber(red ?? NULL_VALUE, 'setPixel expects a red channel value'))));
      const g = Math.max(
        0,
        Math.min(255, Math.round(expectNumber(green ?? NULL_VALUE, 'setPixel expects a green channel value'))),
      );
      const b = Math.max(
        0,
        Math.min(255, Math.round(expectNumber(blue ?? NULL_VALUE, 'setPixel expects a blue channel value'))),
      );
      const a = alpha !== undefined
        ? Math.max(
            0,
            Math.min(255, Math.round(expectNumber(alpha, 'setPixel expects an alpha channel value'))),
          )
        : 255;
      const index = (y * canvas.width + x) * 4;
      canvas.pixels[index] = r;
      canvas.pixels[index + 1] = g;
      canvas.pixels[index + 2] = b;
      canvas.pixels[index + 3] = a;
      return canvas;
    }, 'setPixel'),
  );

  return env;
}

export function run(program: Program, environment?: Environment): Value {
  const env = environment ?? createGlobalEnvironment();
  return evaluateProgram(program, env);
}

export function evaluate(source: string): Value {
  throw new Error('Use parse and run through index.ts');
}

export { createGlobalEnvironment };
