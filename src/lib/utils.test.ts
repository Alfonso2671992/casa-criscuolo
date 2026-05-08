import { describe, it, expect, vi, beforeAll } from 'vitest';

const { cap, esc, safeUrl, pad, dateToStr, strToDisplay, today, daysUntil, snap2arr } = await import('./utils');

describe('cap', () => {
  it('capitalizes first letter', () => {
    expect(cap('hello')).toBe('Hello');
    expect(cap('Hello')).toBe('Hello');
    expect(cap('a')).toBe('A');
  });
  it('handles empty string', () => {
    expect(cap('')).toBe('');
    expect(cap(null as any)).toBe(null as any);
    expect(cap(undefined as any)).toBe(undefined as any);
  });
});

describe('esc', () => {
  it('escapes HTML entities', () => {
    expect(esc('<script>')).toBe('&lt;script&gt;');
    expect(esc('a & b')).toBe('a &amp; b');
    expect(esc('"quote"')).toBe('&quot;quote&quot;');
  });
  it('handles non-string input', () => {
    expect(esc(123)).toBe('123');
    expect(esc(null)).toBe('');
    expect(esc(undefined)).toBe('');
  });
});

describe('safeUrl', () => {
  it('allows http and https URLs', () => {
    expect(safeUrl('https://example.com')).toBe('https://example.com/');
    expect(safeUrl('http://example.com/path')).toBe('http://example.com/path');
  });
  it('rejects non-http protocols', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('');
    expect(safeUrl('file:///etc/passwd')).toBe('');
    expect(safeUrl('data:text/html,<script>')).toBe('');
  });
  it('handles empty string', () => {
    expect(safeUrl('')).toBe('');
  });
});

describe('pad', () => {
  it('zero-pads single digit', () => {
    expect(pad(1)).toBe('01');
    expect(pad(9)).toBe('09');
  });
  it('keeps two digits unchanged', () => {
    expect(pad(10)).toBe('10');
    expect(pad(99)).toBe('99');
  });
});

describe('dateToStr', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(dateToStr(new Date(2026, 4, 8))).toBe('2026-05-08');
    expect(dateToStr(new Date(2025, 0, 1))).toBe('2025-01-01');
  });
});

describe('strToDisplay', () => {
  it('converts YYYY-MM-DD to DD/MM/YYYY', () => {
    expect(strToDisplay('2026-05-08')).toBe('08/05/2026');
    expect(strToDisplay('2025-01-01')).toBe('01/01/2025');
  });
  it('handles null/undefined', () => {
    expect(strToDisplay(null)).toBe('');
    expect(strToDisplay(undefined)).toBe('');
  });
});

describe('today', () => {
  it('returns today as YYYY-MM-DD', () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    expect(today()).toBe(`${y}-${m}-${day}`);
  });
});

describe('daysUntil', () => {
  beforeAll(() => vi.useFakeTimers({ now: new Date('2026-05-08') }));
  it('computes positive difference', () => {
    expect(daysUntil('2026-05-10')).toBe(2);
  });
  it('computes negative difference', () => {
    expect(daysUntil('2026-05-05')).toBe(-3);
  });
  it('returns null for null', () => {
    expect(daysUntil(null)).toBeNull();
  });
});

describe('snap2arr', () => {
  it('converts object to sorted array with _k', () => {
    const obj = {
      k1: { n: 'b', ts: 200 },
      k2: { n: 'a', ts: 100 },
    };
    const arr = snap2arr(obj);
    expect(arr).toHaveLength(2);
    expect(arr[0]._k).toBe('k1');
    expect(arr[0].n).toBe('b');
    expect(arr[1]._k).toBe('k2');
    expect(arr[1].n).toBe('a');
  });
  it('returns empty array for null', () => {
    expect(snap2arr(null)).toEqual([]);
  });
});
