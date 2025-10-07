import {
  AssignmentStatement,
  BlockExpression,
  BlockFunctionExpression,
  CallExpression,
  Expression,
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
  expectNumber,
  isTruthy,
  lookupMethod,
  makeBoolean,
  makeNumber,
  makeString,
  registerMethod,
} from './runtime.js';
import { FunctionValue, Value } from './values.js';

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
    'greaterThan',
    new NativeFunctionValue(([other], self) => {
      const left = expectNumber(self!, 'greaterThan expects a number as the receiver');
      const right = expectNumber(other ?? NULL_VALUE, 'greaterThan expects a number argument');
      return makeBoolean(left > right);
    }, 'greaterThan'),
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
