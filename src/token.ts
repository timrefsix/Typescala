export type TokenType =
  | 'number'
  | 'string'
  | 'identifier'
  | 'let'
  | 'if'
  | 'else'
  | 'true'
  | 'false'
  | 'null'
  | 'arrow'
  | 'assign'
  | 'comma'
  | 'lparen'
  | 'rparen'
  | 'lbrace'
  | 'rbrace'
  | 'newline'
  | 'eof';

export interface Token {
  type: TokenType;
  value?: string;
  position: number;
}
