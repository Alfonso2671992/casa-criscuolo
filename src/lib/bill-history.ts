import { MONTHS } from './constants';
import type { BillRecord, Expense } from './types';

export type BillStatus = 'archiviata' | 'pagata' | 'da pagare';

export interface BillEntry {
  key: string;
  a: number;
  /** YYYY-MM-DD */
  date: string;
  /** e.g. "Ottobre 2026" */
  label: string;
  status: BillStatus;
  current: boolean;
}


const DATE_RE = /^\d{4}-\d{2}-\d{2}/;

function validDate(v: unknown): string | null {
  return typeof v === 'string' && DATE_RE.test(v) ? v.slice(0, 10) : null;
}

export function monthLabel(date: string): string {
  return MONTHS[+date.slice(5, 7) - 1] + ' ' + date.slice(0, 4);
}

/** Short lowercase Italian month, e.g. "ott" */
/** Day and short month under a bar, e.g. "2 nov" */
export function barLabel(date: string): string {
  return +date.slice(8, 10) + ' ' + shortMonth(date);
}

export function shortMonth(date: string): string {
  return MONTHS[+date.slice(5, 7) - 1].slice(0, 3).toLowerCase();
}

/** All known bills of a category (archive + expenses still in the list), newest first */
export function billHistory(cat: string, storico: BillRecord[], expenses: Expense[], currentKey?: string): BillEntry[] {
  const out: BillEntry[] = [];
  for (const r of storico) {
    const date = validDate(r?.d);
    if (r?.c !== cat || !date || typeof r.a !== 'number') continue;
    out.push({ key: r._k ?? '', a: r.a, date, label: monthLabel(date), status: 'archiviata', current: false });
  }
  for (const e of expenses) {
    if (e?.c !== cat || typeof e.a !== 'number') continue;
    const date = validDate(e.sc) ?? validDate(e.dt) ?? validDate(e.paidAt);
    if (!date) continue;
    const key = e._k ?? '';
    out.push({ key, a: e.a, date, label: monthLabel(date), status: e.s === 'ok' ? 'pagata' : 'da pagare', current: !!currentKey && key === currentKey });
  }
  return out.sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : 0));
}
