type Token =
  | { type: 'number'; value: number }
  | { type: 'op'; value: '+' | '-' | '*' | '/' | '^' }
  | { type: 'unary'; value: 'neg' | 'sqrt' }
  | { type: 'percent' }
  | { type: 'lparen' }
  | { type: 'rparen' };

function tokenize(expr: string): Token[] {
  const normalized = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, String(Math.PI))
    .replace(/\s+/g, '');

  const tokens: Token[] = [];
  let i = 0;

  while (i < normalized.length) {
    const ch = normalized[i];

    if (/[0-9.]/.test(ch)) {
      let numStr = '';
      let dotCount = 0;
      while (i < normalized.length && /[0-9.]/.test(normalized[i])) {
        if (normalized[i] === '.') {
          dotCount++;
          if (dotCount > 1) throw new Error('數字格式錯誤');
        }
        numStr += normalized[i];
        i++;
      }
      if (numStr === '.') throw new Error('數字格式錯誤');
      tokens.push({ type: 'number', value: parseFloat(numStr) });
      continue;
    }

    if (ch === '√') {
      tokens.push({ type: 'unary', value: 'sqrt' });
      i++;
      continue;
    }

    if (ch === '(') {
      // Implicit multiplication e.g. 2(3) or (2)(3) or 5√(4)
      const prev = tokens[tokens.length - 1];
      if (prev && (prev.type === 'number' || prev.type === 'rparen' || prev.type === 'percent')) {
        tokens.push({ type: 'op', value: '*' });
      }
      tokens.push({ type: 'lparen' });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'rparen' });
      i++;
      continue;
    }

    if (ch === '%') {
      tokens.push({ type: 'percent' });
      i++;
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^') {
      const prev = tokens[tokens.length - 1];
      const isUnaryMinus =
        ch === '-' &&
        (!prev || prev.type === 'op' || prev.type === 'lparen' || prev.type === 'unary');

      if (isUnaryMinus) {
        tokens.push({ type: 'unary', value: 'neg' });
      } else {
        tokens.push({ type: 'op', value: ch });
      }
      i++;
      continue;
    }

    throw new Error(`不支援的符號: ${ch}`);
  }

  return tokens;
}

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  parse(): number {
    if (this.tokens.length === 0) return 0;
    const val = this.parseAddSub();
    if (this.pos < this.tokens.length) {
      throw new Error('算式語法錯誤');
    }
    return val;
  }

  private parseAddSub(): number {
    let left = this.parseMulDiv();
    while (true) {
      const tok = this.peek();
      if (tok && tok.type === 'op' && (tok.value === '+' || tok.value === '-')) {
        this.consume();
        const right = this.parseMulDiv();
        left = tok.value === '+' ? left + right : left - right;
      } else {
        break;
      }
    }
    return left;
  }

  private parseMulDiv(): number {
    let left = this.parsePower();
    while (true) {
      const tok = this.peek();
      if (tok && tok.type === 'op' && (tok.value === '*' || tok.value === '/')) {
        this.consume();
        const right = this.parsePower();
        if (tok.value === '/') {
          if (right === 0) throw new Error('無法除以零');
          left = left / right;
        } else {
          left = left * right;
        }
      } else {
        break;
      }
    }
    return left;
  }

  private parsePower(): number {
    const base = this.parseUnary();
    const tok = this.peek();
    if (tok && tok.type === 'op' && tok.value === '^') {
      this.consume();
      const exp = this.parsePower();
      return Math.pow(base, exp);
    }
    return base;
  }

  private parseUnary(): number {
    const tok = this.peek();
    if (tok && tok.type === 'unary') {
      this.consume();
      const val = this.parseUnary();
      if (tok.value === 'neg') return -val;
      if (tok.value === 'sqrt') {
        if (val < 0) throw new Error('負數無實數平方根');
        return Math.sqrt(val);
      }
    }
    return this.parsePostfix();
  }

  private parsePostfix(): number {
    let val = this.parsePrimary();
    while (true) {
      const tok = this.peek();
      if (tok && tok.type === 'percent') {
        this.consume();
        val = val / 100;
      } else {
        break;
      }
    }
    return val;
  }

  private parsePrimary(): number {
    const tok = this.peek();
    if (!tok) throw new Error('算式尚未完整');

    if (tok.type === 'number') {
      this.consume();
      return tok.value;
    }

    if (tok.type === 'lparen') {
      this.consume();
      const val = this.parseAddSub();
      const next = this.peek();
      if (!next || next.type !== 'rparen') {
        throw new Error('括號未閉合');
      }
      this.consume();
      return val;
    }

    throw new Error('算式格式錯誤');
  }
}

export function cleanPrecision(num: number): number {
  if (!Number.isFinite(num)) throw new Error('數值超出範圍');
  if (Math.abs(num) < 1e-14) return 0;
  return Number(num.toPrecision(12));
}

export function evaluateExpression(expr: string): number {
  const trimmed = expr.trim();
  if (!trimmed) return 0;
  const tokens = tokenize(trimmed);
  const parser = new Parser(tokens);
  return cleanPrecision(parser.parse());
}

export function tryEvaluatePreview(expr: string): string | null {
  const trimmed = expr.trim();
  if (!trimmed) return null;
  // Do not show preview for a single plain number
  if (/^-?[0-9.]+$/.test(trimmed)) return null;
  try {
    const result = evaluateExpression(trimmed);
    return formatDisplayNumber(result);
  } catch {
    return null;
  }
}

export function formatDisplayNumber(num: number): string {
  if (!Number.isFinite(num)) return '錯誤';
  const cleaned = cleanPrecision(num);
  if (Math.abs(cleaned) >= 1e12 || (Math.abs(cleaned) > 0 && Math.abs(cleaned) < 1e-9)) {
    return cleaned.toExponential(6).replace(/\.?0+e/, 'e');
  }
  const str = String(cleaned);
  const [intPart, decPart] = str.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
}

export function stripCommas(str: string): string {
  return str.replace(/,/g, '');
}
