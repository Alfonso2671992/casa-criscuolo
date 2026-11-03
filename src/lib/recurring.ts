import { MONTHS } from './constants';
import type { RecurringExpense, DueReminder } from './types';

/** Days before the 1st of the month in which reminders start showing */
export const REMINDER_LEAD_DAYS = 2;

/**
 * Due date of the reminder window that contains `now`, or null if `now` is outside every window.
 * The window for month M runs from REMINDER_LEAD_DAYS days before the 1st of M up to the due day in M.
 * A due day past the end of the month (e.g. 31 in November) falls on the last day of that month.
 */
export function dueDateFor(dueDay: number, now: Date): Date | null {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (const offset of [0, 1]) {
    const y = today.getFullYear();
    const m = today.getMonth() + offset;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const due = new Date(y, m, Math.min(dueDay, lastDay));
    const start = new Date(y, m, 1 - REMINDER_LEAD_DAYS);
    if (start <= today && today <= due) return due;
  }
  return null;
}

/** Day number with its Italian article: "il 3", "l'1", "l'8", "l'11" */
export function dayWithArticle(day: number): string {
  return (day === 1 || day === 8 || day === 11 ? "l'" : 'il ') + day;
}

/** "il 3 dicembre", "l'1 dicembre" */
export function formatDueDate(d: Date): string {
  return `${dayWithArticle(d.getDate())} ${MONTHS[d.getMonth()].toLowerCase()}`;
}

/** Expenses whose reminder window contains `now`, closest due date first */
export function dueReminders(list: RecurringExpense[], now: Date): DueReminder[] {
  const out: { due: number; item: DueReminder }[] = [];
  for (const r of list) {
    const due = dueDateFor(r.to, now);
    if (due) out.push({ due: due.getTime(), item: { ...r, dueLabel: formatDueDate(due) } });
  }
  out.sort((x, y) => x.due - y.due || x.item.n.localeCompare(y.item.n));
  return out.map(o => o.item);
}
