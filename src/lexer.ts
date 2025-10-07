import { Token, TokenType } from './token.js';

const keywords: Record<string, TokenType> = {
  let: 'let',
  if: 'if',
  else: 'else',
  true: 'true',
  false: 'false',
  null: 'null',
};

function isWhitespace(char: string): boolean {
  return char === ' ' || char === '\t' || char === '\r';
}

function isDigit(char: string): boolean {
  return char >= '0' && char <= '9';
}

function isIdentifierStart(char: string): boolean {
  return (
    (char >= 'a' && char <= 'z') ||
    (char >= 'A' && char <= 'Z') ||
    char === '_'
  );
}

function isIdentifierPart(char: string): boolean {
  return isIdentifierStart(char) || isDigit(char);
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let position = 0;

  const pushToken = (type: TokenType, value?: string) => {
    tokens.push({ type, value, position });
  };

  const advance = () => source[position++];
  const peek = () => source[position];
  const peekNext = () => source[position + 1];

  while (position < source.length) {
    const char = peek();

    if (char === '\n') {
      advance();
      pushToken('newline');
      continue;
    }

    if (isWhitespace(char)) {
      advance();
      continue;
    }

    if (char === '/' && peekNext() === '/') {
      while (position < source.length && peek() !== '\n') {
        advance();
      }
      continue;
    }

    if (char === '+') {
      advance();
      pushToken('identifier', 'plus');
      continue;
    }

    if (char === '-') {
      advance();
      pushToken('identifier', 'minus');
      continue;
    }

    if (char === '*') {
      advance();
      pushToken('identifier', 'times');
      continue;
    }

    if (char === '/') {
      advance();
      pushToken('identifier', 'dividedBy');
      continue;
    }

    if (char === '<') {
      advance();
      if (peek() === '=') {
        advance();
        pushToken('identifier', 'lessThanOrEqual');
      } else {
        pushToken('identifier', 'lessThan');
      }
      continue;
    }

    if (char === '>') {
      advance();
      if (peek() === '=') {
        advance();
        pushToken('identifier', 'greaterThanOrEqual');
      } else {
        pushToken('identifier', 'greaterThan');
      }
      continue;
    }

    if (char === '=' && peekNext() === '=') {
      advance();
      advance();
      pushToken('identifier', 'equals');
      continue;
    }

    if (char === '"') {
      advance();
      let value = '';
      while (position < source.length && peek() !== '"') {
        const nextChar = advance();
        if (nextChar === '\\') {
          const escape = advance();
          if (escape === 'n') {
            value += '\n';
          } else if (escape === 't') {
            value += '\t';
          } else {
            value += escape;
          }
        } else {
          value += nextChar;
        }
      }
      if (peek() !== '"') {
        throw new Error('Unterminated string literal');
      }
      advance();
      pushToken('string', value);
      continue;
    }

    if (isDigit(char)) {
      let number = '';
      while (position < source.length && isDigit(peek())) {
        number += advance();
      }
      if (peek() === '.' && isDigit(peekNext())) {
        number += advance();
        while (position < source.length && isDigit(peek())) {
          number += advance();
        }
      }
      pushToken('number', number);
      continue;
    }

    if (isIdentifierStart(char)) {
      let identifier = '';
      while (position < source.length && isIdentifierPart(peek())) {
        identifier += advance();
      }
      const keywordToken = keywords[identifier];
      if (keywordToken) {
        pushToken(keywordToken);
      } else {
        pushToken('identifier', identifier);
      }
      continue;
    }

    if (char === '=' && peekNext() === '>') {
      advance();
      advance();
      pushToken('arrow');
      continue;
    }

    switch (char) {
      case '=':
        advance();
        pushToken('assign');
        continue;
      case ',':
        advance();
        pushToken('comma');
        continue;
      case '(':
        advance();
        pushToken('lparen');
        continue;
      case ')':
        advance();
        pushToken('rparen');
        continue;
      case '{':
        advance();
        pushToken('lbrace');
        continue;
      case '}':
        advance();
        pushToken('rbrace');
        continue;
      default:
        throw new Error(`Unexpected character '${char}' at position ${position}`);
    }
  }

  pushToken('eof');
  return tokens;
}
