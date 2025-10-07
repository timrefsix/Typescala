import { tokenize } from './lexer.js';
import {
  AssignmentStatement,
  BlockExpression,
  BlockFunctionExpression,
  CallExpression,
  Expression,
  ExpressionStatement,
  FunctionExpression,
  Identifier,
  IfExpression,
  InfixExpression,
  LetStatement,
  Program,
  Statement,
} from './ast.js';
import { Token } from './token.js';

type TokenCursor = {
  tokens: Token[];
  position: number;
};

const INFIX_OPERATORS = new Set([
  'plus',
  'minus',
  'times',
  'dividedBy',
  'equals',
  'lessThan',
  'lessThanOrEqual',
  'greaterThan',
  'greaterThanOrEqual',
  'and',
  'or',
]);

function current(cursor: TokenCursor): Token {
  return cursor.tokens[cursor.position];
}

function advance(cursor: TokenCursor): Token {
  return cursor.tokens[cursor.position++];
}

function check(cursor: TokenCursor, type: Token['type']): boolean {
  return current(cursor).type === type;
}

function match(cursor: TokenCursor, ...types: Token['type'][]): boolean {
  for (const type of types) {
    if (check(cursor, type)) {
      advance(cursor);
      return true;
    }
  }
  return false;
}

function consume(cursor: TokenCursor, type: Token['type'], message: string): Token {
  if (check(cursor, type)) {
    return advance(cursor);
  }
  const token = current(cursor);
  throw new Error(`${message} at token ${token.type} (${token.position})`);
}

function skipNewlines(cursor: TokenCursor): void {
  while (match(cursor, 'newline')) {
    // skip
  }
}

function isFunctionSignature(cursor: TokenCursor): boolean {
  const start = cursor.position;
  if (!check(cursor, 'lparen')) {
    return false;
  }
  let depth = 0;
  let index = start;
  let expectsParam = true;
  let hasArrow = false;
  let foundClosing = false;
  while (index < cursor.tokens.length) {
    const token = cursor.tokens[index++];
    switch (token.type) {
      case 'lparen': {
        depth++;
        if (depth > 1) {
          cursor.position = start;
          return false;
        }
        break;
      }
      case 'rparen': {
        if (depth === 0) {
          cursor.position = start;
          return false;
        }
        depth--;
        const next = cursor.tokens[index];
        hasArrow = next?.type === 'arrow';
        foundClosing = true;
        break;
      }
      case 'comma': {
        expectsParam = true;
        break;
      }
      case 'identifier': {
        if (!expectsParam) {
          cursor.position = start;
          return false;
        }
        expectsParam = false;
        break;
      }
      default: {
        cursor.position = start;
        return false;
      }
    }

    if (foundClosing && depth === 0) {
      break;
    }
  }
  cursor.position = start;
  return hasArrow;
}

function createBlockFromExpression(expression: Expression): BlockExpression {
  return {
    type: 'block',
    statements: [
      {
        type: 'expression',
        expression,
      } as ExpressionStatement,
    ],
    asFunction: false,
  };
}

function parseFunctionBody(cursor: TokenCursor): BlockExpression {
  skipNewlines(cursor);
  if (check(cursor, 'lbrace')) {
    return parseBlock(cursor, false);
  }
  const expression = parseExpression(cursor);
  return createBlockFromExpression(expression);
}

function parseProgram(cursor: TokenCursor): Program {
  const statements: Statement[] = [];
  skipNewlines(cursor);
  while (!check(cursor, 'eof')) {
    const statement = parseStatement(cursor);
    statements.push(statement);
    skipNewlines(cursor);
  }
  return {
    type: 'program',
    statements,
  };
}

function parseStatement(cursor: TokenCursor): Statement {
  if (match(cursor, 'let')) {
    const identifier = consume(cursor, 'identifier', 'Expected identifier after let');
    consume(cursor, 'assign', 'Expected = after identifier');
    const value = parseExpression(cursor);
    return {
      type: 'let',
      name: identifier.value!,
      value,
    } satisfies LetStatement;
  }

  if (check(cursor, 'identifier')) {
    const next = cursor.tokens[cursor.position + 1];
    if (next?.type === 'assign') {
      const identifier = advance(cursor);
      advance(cursor); // consume assign
      const value = parseExpression(cursor);
      return {
        type: 'assignment',
        name: identifier.value!,
        value,
      } satisfies AssignmentStatement;
    }
  }

  const expression = parseExpression(cursor);
  return {
    type: 'expression',
    expression,
  } satisfies ExpressionStatement;
}

function parseExpression(cursor: TokenCursor): Expression {
  return parseInfix(cursor);
}

function parseInfix(cursor: TokenCursor): Expression {
  let expression = parseCall(cursor);

  while (check(cursor, 'identifier') && INFIX_OPERATORS.has(current(cursor).value!)) {
    const operatorToken = advance(cursor);
    const operator = operatorToken.value!;
    const right = parseCall(cursor);
    expression = {
      type: 'infix',
      operator,
      left: expression,
      right,
    } satisfies InfixExpression;
  }

  return expression;
}

function parseCall(cursor: TokenCursor): Expression {
  let expression = parsePrimary(cursor);

  while (true) {
    if (match(cursor, 'lparen')) {
      const args: Expression[] = [];
      if (!check(cursor, 'rparen')) {
        do {
          args.push(parseExpression(cursor));
        } while (match(cursor, 'comma'));
      }
      consume(cursor, 'rparen', 'Expected ) to close arguments');
      expression = {
        type: 'call',
        callee: expression,
        args,
      } satisfies CallExpression;
      continue;
    }

    if (check(cursor, 'lbrace')) {
      if (expression.type !== 'call') {
        break;
      }
      const blockArg = parseBlock(cursor, true);
      const callArgs = [...expression.args];
      const callee = expression.callee;
      callArgs.push({
        type: 'blockFunction',
        block: blockArg,
      } satisfies BlockFunctionExpression);
      expression = {
        type: 'call',
        callee,
        args: callArgs,
      } satisfies CallExpression;
      continue;
    }

    break;
  }

  return expression;
}

function parsePrimary(cursor: TokenCursor): Expression {
  if (match(cursor, 'number')) {
    const token = cursor.tokens[cursor.position - 1];
    return {
      type: 'number',
      value: Number(token.value!),
    };
  }

  if (match(cursor, 'string')) {
    const token = cursor.tokens[cursor.position - 1];
    return {
      type: 'string',
      value: token.value!,
    };
  }

  if (match(cursor, 'true')) {
    return { type: 'boolean', value: true };
  }

  if (match(cursor, 'false')) {
    return { type: 'boolean', value: false };
  }

  if (match(cursor, 'null')) {
    return { type: 'null' };
  }

  if (match(cursor, 'identifier')) {
    const token = cursor.tokens[cursor.position - 1];
    return {
      type: 'identifier',
      name: token.value!,
    } satisfies Identifier;
  }

  if (match(cursor, 'if')) {
    return parseIf(cursor);
  }

  if (check(cursor, 'lparen')) {
    if (isFunctionSignature(cursor)) {
      advance(cursor); // consume lparen
      const params: string[] = [];
      if (!check(cursor, 'rparen')) {
        do {
          const param = consume(cursor, 'identifier', 'Expected parameter name');
          params.push(param.value!);
        } while (match(cursor, 'comma'));
      }
      consume(cursor, 'rparen', 'Expected ) after parameter list');
      consume(cursor, 'arrow', 'Expected => after parameter list');
      const body = parseFunctionBody(cursor);
      return {
        type: 'function',
        params,
        body,
      } satisfies FunctionExpression;
    }

    advance(cursor); // consume lparen
    const expression = parseExpression(cursor);
    consume(cursor, 'rparen', 'Expected ) after expression');
    return expression;
  }

  if (match(cursor, 'lbrace')) {
    const block = parseBlockWithConsumedBrace(cursor, false);
    return block;
  }

  throw new Error(`Unexpected token ${current(cursor).type}`);
}

function parseBlock(cursor: TokenCursor, asFunction: boolean): BlockExpression {
  consume(cursor, 'lbrace', 'Expected { to start block');
  return parseBlockWithConsumedBrace(cursor, asFunction);
}

function parseBlockWithConsumedBrace(cursor: TokenCursor, asFunction: boolean): BlockExpression {
  const statements: Statement[] = [];
  skipNewlines(cursor);
  while (!check(cursor, 'rbrace')) {
    const statement = parseStatement(cursor);
    statements.push(statement);
    skipNewlines(cursor);
  }
  consume(cursor, 'rbrace', 'Expected } to close block');
  return {
    type: 'block',
    statements,
    asFunction,
  } satisfies BlockExpression;
}

function parseIf(cursor: TokenCursor): IfExpression {
  const condition = parseExpression(cursor);
  skipNewlines(cursor);
  let thenBranch: BlockExpression;
  if (check(cursor, 'lbrace')) {
    thenBranch = parseBlock(cursor, false);
  } else {
    const expression = parseExpression(cursor);
    thenBranch = createBlockFromExpression(expression);
  }
  skipNewlines(cursor);
  let elseBranch: BlockExpression | undefined;
  if (match(cursor, 'else')) {
    skipNewlines(cursor);
    if (match(cursor, 'if')) {
      const nestedIf = parseIf(cursor);
      elseBranch = createBlockFromExpression(nestedIf);
    } else if (check(cursor, 'lbrace')) {
      elseBranch = parseBlock(cursor, false);
    } else {
      const expression = parseExpression(cursor);
      elseBranch = createBlockFromExpression(expression);
    }
  }
  return {
    type: 'if',
    condition,
    thenBranch,
    elseBranch,
  } satisfies IfExpression;
}

export function parse(source: string): Program {
  const tokens = tokenize(source);
  const cursor: TokenCursor = {
    tokens,
    position: 0,
  };
  return parseProgram(cursor);
}
