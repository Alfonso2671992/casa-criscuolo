import { describe, it, expect, vi, beforeAll } from 'vitest';

const { cap, esc, safeUrl, pad, dateToStr, strToDisplay, daysUntil, snap2arr } = await import('./utils');

describe('cap - edge cases', () => {
  it('handles already capitalized', () => {
    expect(cap('Hello World')).toBe('Hello World');
  });
  it('handles single character', () => {
    expect(cap('z')).toBe('Z');
    expect(cap('Z')).toBe('Z');
  });
  it('handles numbers and symbols', () => {
    expect(cap('123abc')).toBe('123abc');
    expect(cap('?test')).toBe('?test');
  });
});

describe('esc - edge cases', () => {
  it('escapes multiple HTML entities', () => {
    expect(esc('<b>"Hello" & \'World\'</b>')).toBe('&lt;b&gt;&quot;Hello&quot; &amp; \'World\'&lt;/b&gt;');
  });
  it('handles empty string', () => {
    expect(esc('')).toBe('');
  });
  it('handles boolean input', () => {
    expect(esc(true as any)).toBe('true');
    expect(esc(false as any)).toBe('false');
  });
  it('handles zero number', () => {
    expect(esc(0 as any)).toBe('0');
  });
});

describe('safeUrl - edge cases', () => {
  it('rejects URLs with spaces', () => {
    expect(safeUrl('https://example .com')).toBe('');
  });
  it('rejects URLs with special protocol', () => {
    expect(safeUrl('ftp://files.example.com')).toBe('');
    expect(safeUrl('ws://example.com')).toBe('');
  });
  it('allows URLs with query params', () => {
    expect(safeUrl('https://example.com/path?a=1&b=2')).toBe('https://example.com/path?a=1&b=2');
  });
  it('handles whitespace string', () => {
    expect(safeUrl('  ')).toBe('');
  });
});

describe('pad - edge cases', () => {
  it('handles zero', () => {
    expect(pad(0)).toBe('00');
  });
  it('handles negative numbers', () => {
    expect(pad(-1)).toBe('-1');
  });
  it('handles large numbers', () => {
    expect(pad(100)).toBe('100');
  });
});

describe('dateToStr - edge cases', () => {
  it('formats December date correctly', () => {
    expect(dateToStr(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
  it('formats January date correctly', () => {
    expect(dateToStr(new Date(2026, 0, 1))).toBe('2026-01-01');
  });
  it('pads month and day', () => {
    expect(dateToStr(new Date(2026, 2, 5))).toBe('2026-03-05');
  });
});

describe('strToDisplay - edge cases', () => {
  it('handles empty string', () => {
    expect(strToDisplay('')).toBe('');
  });
  it('handles malformed date', () => {
    expect(strToDisplay('abc')).toBe('undefined/undefined/abc');
  });
});

describe('daysUntil - edge cases', () => {
  beforeAll(() => vi.useFakeTimers({ now: new Date('2026-05-08') }));

  it('returns 0 for today', () => {
    expect(daysUntil('2026-05-08')).toBe(0);
  });
  it('handles empty string', () => {
    expect(daysUntil('')).toBeNull();
  });
  it('handles malformed date', () => {
    const result = daysUntil('not-a-date');
    expect(result).toBeNaN();
  });
});

describe('snap2arr - edge cases', () => {
  it('handles empty object', () => {
    expect(snap2arr({})).toEqual([]);
  });
  it('sorts items without ts to bottom', () => {
    const obj = {
      a: { n: 'no ts' } as any,
      b: { n: 'has ts', ts: 500 } as any,
    };
    const arr = snap2arr(obj);
    expect(arr).toHaveLength(2);
    expect(arr[0]._k).toBe('b');
    expect(arr[1]._k).toBe('a');
  });
  it('handles single item', () => {
    const obj = { k1: { n: 'only', ts: 100 } as any };
    const arr = snap2arr(obj);
    expect(arr).toHaveLength(1);
    expect(arr[0]._k).toBe('k1');
    expect(arr[0].n).toBe('only');
  });
  it('preserves all properties besides _k', () => {
    const obj = { k1: { n: 'test', a: 10, b: true } as any };
    const arr = snap2arr(obj);
    expect(arr[0].a).toBe(10);
    expect(arr[0].b).toBe(true);
  });
});
