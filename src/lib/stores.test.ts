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
  budget,
  budgetMonth,
  monthlyStats,
  saveBudget,
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

describe('budgetMonth', () => {
  it('defaults to current YYYY-MM', () => {
    const now = new Date();
    const ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    expect(get(budgetMonth)).toBe(ym);
  });
});

describe('saveBudget', () => {
  it('persists to store and localStorage', () => {
    saveBudget({ luce: 100, spesa: 300 });
    expect(get(budget)).toEqual({ luce: 100, spesa: 300 });
    expect(JSON.parse(localStorage.getItem('cc_budget')!)).toEqual({ luce: 100, spesa: 300 });
  });

  it('overwrites previous budget', () => {
    saveBudget({ luce: 50 });
    saveBudget({ luce: 80, gas: 60 });
    expect(get(budget)).toEqual({ luce: 80, gas: 60 });
  });
});

describe('monthlyStats', () => {
  it('only counts paid expenses (s=ok)', () => {
    budgetMonth.set('2026-05');
    cacheExpenses([
      { _k: 'e1', n: 'a', a: 100, c: 'luce', dt: '2026-05-10', sc: null, payer: 'A', half: null, s: 'ok' as const, ts: 1 },
      { _k: 'e2', n: 'b', a: 50, c: 'luce', dt: '2026-05-10', sc: null, payer: 'A', half: null, s: 'da' as const, ts: 2 },
    ]);
    expect(get(monthlyStats).get('luce')).toBe(100);
  });

  it('filters by budgetMonth', () => {
    budgetMonth.set('2026-04');
    cacheExpenses([
      { _k: 'e1', n: 'a', a: 30, c: 'spesa', dt: '2026-04-15', sc: null, payer: 'A', half: null, s: 'ok' as const, ts: 1 },
      { _k: 'e2', n: 'b', a: 20, c: 'spesa', dt: '2026-05-01', sc: null, payer: 'A', half: null, s: 'ok' as const, ts: 2 },
    ]);
    expect(get(monthlyStats).get('spesa')).toBe(30);
  });

  it('uses sc (scadenza) as fallback date', () => {
    budgetMonth.set('2026-06');
    cacheExpenses([
      { _k: 'e1', n: 'a', a: 75, c: 'luce', dt: null, sc: '2026-06-05', payer: 'A', half: null, s: 'ok' as const, ts: 1 },
    ]);
    expect(get(monthlyStats).get('luce')).toBe(75);
  });

  it('groups by category', () => {
    budgetMonth.set('2026-05');
    cacheExpenses([
      { _k: 'e1', n: 'a', a: 10, c: 'luce', dt: '2026-05-01', sc: null, payer: 'A', half: null, s: 'ok' as const, ts: 1 },
      { _k: 'e2', n: 'b', a: 20, c: 'luce', dt: '2026-05-02', sc: null, payer: 'A', half: null, s: 'ok' as const, ts: 2 },
      { _k: 'e3', n: 'c', a: 30, c: 'acqua', dt: '2026-05-03', sc: null, payer: 'A', half: null, s: 'ok' as const, ts: 3 },
    ]);
    const m = get(monthlyStats);
    expect(m.get('luce')).toBe(30);
    expect(m.get('acqua')).toBe(30);
  });

  it('returns empty map when no expenses match', () => {
    budgetMonth.set('2026-01');
    cacheExpenses([
      { _k: 'e1', n: 'a', a: 10, c: 'luce', dt: '2026-05-01', sc: null, payer: 'A', half: null, s: 'ok' as const, ts: 1 },
    ]);
    expect(get(monthlyStats).size).toBe(0);
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
