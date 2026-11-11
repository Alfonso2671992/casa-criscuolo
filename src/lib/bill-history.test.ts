import { describe, it, expect } from 'vitest';
import { billHistory, monthLabel, shortMonth, barLabel } from './bill-history';
import type { BillRecord, Expense } from './types';

const rec = (k: string, d: string, a: number, c = 'gas'): BillRecord => ({ _k: k, c, n: 'Gas', a, d, ts: 0 });
const exp = (k: string, o: Partial<Expense>): Expense => ({ _k: k, n: 'Gas', a: 10, c: 'gas', dt: null, sc: null, payer: 'Alfonso', half: null, s: 'da', ts: 0, ...o });

describe('billHistory', () => {
  it('merges archive and expenses of the category, newest first', () => {
    const r = billHistory('gas',
      [rec('s1', '2026-08-10', 60), rec('s2', '2026-09-10', 70), rec('x', '2026-10-01', 99, 'luce')],
      [exp('e1', { sc: '2026-11-15', a: 90, s: 'da' }), exp('e2', { dt: '2026-10-12', a: 80, s: 'ok' }), exp('e3', { c: 'spesa', dt: '2026-11-01' })],
      'e1');
    expect(r.map(e => e.key)).toEqual(['e1', 'e2', 's2', 's1']);
    expect(r.map(e => e.status)).toEqual(['da pagare', 'pagata', 'archiviata', 'archiviata']);
    expect(r.map(e => e.current)).toEqual([true, false, false, false]);
    expect(r[0].label).toBe('Novembre 2026');
    expect(r[1].date).toBe('2026-10-12');
  });

  it('uses sc, then dt, then paidAt as the expense date', () => {
    const r = billHistory('gas', [], [
      exp('a', { sc: '2026-03-01', dt: '2026-02-01', paidAt: '2026-01-01' }),
      exp('b', { dt: '2026-02-01', paidAt: '2026-01-01' }),
      exp('c', { paidAt: '2026-01-01', s: 'ok' }),
    ]);
    expect(r.map(e => [e.key, e.date])).toEqual([['a', '2026-03-01'], ['b', '2026-02-01'], ['c', '2026-01-01']]);
  });

  it('skips entries without a date', () => {
    const r = billHistory('gas', [rec('s1', '', 5)], [exp('e1', {})]);
    expect(r).toEqual([]);
  });

  it('formats month labels', () => {
    expect(monthLabel('2026-10-05')).toBe('Ottobre 2026');
    expect(shortMonth('2026-10-05')).toBe('ott');
    expect(shortMonth('2027-01-31')).toBe('gen');
    expect(barLabel('2026-11-02')).toBe('2 nov');
    expect(barLabel('2026-11-30')).toBe('30 nov');
  });
});

