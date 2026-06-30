import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

beforeEach(() => {
  localStorage.clear();
});

const {
  showToast,
  cacheExpenses,
  cacheWishes,
  cacheMisure,
  cacheAcquisti,
  initDark,
  toast,
  names,
  expenses,
  wishes,
  misure,
  acquisti,
  totalUnpaid,
  totalPaid,
  darkMode,
} = await import('./stores');

describe('showToast', () => {
  it('sets toast message', () => {
    showToast('test message');
    expect(get(toast)?.msg).toBe('test message');
  });

  it('clears toast after duration', async () => {
    vi.useFakeTimers();
    showToast('test', 100);
    expect(get(toast)?.msg).toBe('test');
    vi.advanceTimersByTime(150);
    expect(get(toast)).toBeNull();
    vi.useRealTimers();
  });

  it('does not clear toast when duration is 0', async () => {
    showToast('persistent', 0);
    expect(get(toast)?.msg).toBe('persistent');
  });
});

describe('cacheExpenses', () => {
  it('updates expenses store and localStorage', () => {
    const data = [{ _k: 'e1', n: 'test', a: 10, c: 'altro', dt: null, sc: null, payer: 'A', half: null, s: 'da' as const, ts: 100 }];
    cacheExpenses(data);
    expect(get(expenses)).toEqual(data);
    expect(JSON.parse(localStorage.getItem('cc_e')!)).toEqual(data);
  });
});

describe('cacheWishes', () => {
  it('updates wishes store and localStorage', () => {
    const data = [{ _k: 'w1', n: 'item', c: 'Lampada', d: '', l: '', bgt: null, p: null, b: false, ts: 100 }];
    cacheWishes(data);
    expect(get(wishes)).toEqual(data);
    expect(JSON.parse(localStorage.getItem('cc_w')!)).toEqual(data);
  });
});

describe('cacheMisure', () => {
  it('updates misure store and localStorage', () => {
    const data = [{ _k: 'm1', n: 'nicchia', d: 'L 40 x P 60', l: 40, w: 60, h: null, note: '', p: null, ts: 100 }];
    cacheMisure(data);
    expect(get(misure)).toEqual(data);
    expect(JSON.parse(localStorage.getItem('cc_m')!)).toEqual(data);
  });
});

describe('cacheAcquisti', () => {
  it('updates acquisti store and localStorage', () => {
    const data = [{ _k: 'a1', n: 'latte', c: 'Spesa', b: false, qta: '1', ts: 100 }];
    cacheAcquisti(data);
    expect(get(acquisti)).toEqual(data);
    expect(JSON.parse(localStorage.getItem('cc_a')!)).toEqual(data);
  });
});

describe('totalUnpaid / totalPaid', () => {
  it('computes derived totals from expenses', () => {
    cacheExpenses([
      { _k: 'e1', n: 'a', a: 100, c: 'cibo', dt: null, sc: null, payer: 'A', half: null, s: 'da' as const, ts: 1 },
      { _k: 'e2', n: 'b', a: 50, c: 'cibo', dt: null, sc: null, payer: 'B', half: null, s: 'ok' as const, ts: 2 },
      { _k: 'e3', n: 'c', a: 25.50, c: 'cibo', dt: null, sc: null, payer: 'A', half: null, s: 'da' as const, ts: 3 },
    ]);
    expect(get(totalUnpaid)).toBe(125.5);
    expect(get(totalPaid)).toBe(50);
  });

  it('returns 0 when no expenses', () => {
    cacheExpenses([]);
    expect(get(totalUnpaid)).toBe(0);
    expect(get(totalPaid)).toBe(0);
  });
});

describe('initDark', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
  });

  it('sets data-theme to dark when cc_dark is true', () => {
    localStorage.setItem('cc_dark', 'true');
    initDark();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(get(darkMode)).toBe(true);
  });

  it('sets data-theme to light when cc_dark is false', () => {
    localStorage.setItem('cc_dark', 'false');
    initDark();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(get(darkMode)).toBe(false);
  });

  it('defaults to light when cc_dark is not set', () => {
    initDark();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(get(darkMode)).toBe(false);
  });
});
