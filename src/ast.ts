export interface Program {
  type: 'program';
  statements: Statement[];
}

export type Statement =
  | LetStatement
  | AssignmentStatement
  | ExpressionStatement;

export interface LetStatement {
  type: 'let';
  name: string;
  value: Expression;
}

export interface AssignmentStatement {
  type: 'assignment';
  name: string;
  value: Expression;
}

export interface ExpressionStatement {
  type: 'expression';
  expression: Expression;
}

export type Expression =
  | NumberLiteral
  | StringLiteral
  | Identifier
  | FunctionExpression
  | CallExpression
  | BlockExpression
  | BlockFunctionExpression
  | IfExpression
  | InfixExpression
  | BooleanLiteral
  | NullLiteral;

export interface NumberLiteral {
  type: 'number';
  value: number;
}

export interface StringLiteral {
  type: 'string';
  value: string;
}

export interface BooleanLiteral {
  type: 'boolean';
  value: boolean;
}

export interface NullLiteral {
  type: 'null';
}

export interface Identifier {
  type: 'identifier';
  name: string;
}

export interface FunctionExpression {
  type: 'function';
  params: string[];
  body: BlockExpression;
}

export interface CallExpression {
  type: 'call';
  callee: Expression;
  args: Expression[];
}

export interface BlockExpression {
  type: 'block';
  statements: Statement[];
  asFunction: boolean;
}

export interface BlockFunctionExpression {
  type: 'blockFunction';
  block: BlockExpression;
}

export interface IfExpression {
  type: 'if';
  condition: Expression;
  thenBranch: BlockExpression;
  elseBranch?: BlockExpression;
}

export interface InfixExpression {
  type: 'infix';
  operator: string;
  left: Expression;
  right: Expression;
}
