import { describe, it, expect } from 'vitest';
import { dueDateFor, dueReminders, formatDueDate, dayWithArticle } from './recurring';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day, 10, 30);
const label = (dueDay: number, now: Date) => {
  const due = dueDateFor(dueDay, now);
  return due ? formatDueDate(due) : null;
};

describe('dueDateFor', () => {
  it('starts 2 days before the 1st and points to next month', () => {
    expect(label(3, d(2026, 11, 28))).toBeNull();
    expect(label(3, d(2026, 11, 29))).toBe('il 3 dicembre');
    expect(label(5, d(2026, 11, 30))).toBe('il 5 dicembre');
  });

  it('stays visible up to the due day included', () => {
    expect(label(3, d(2026, 12, 1))).toBe('il 3 dicembre');
    expect(label(3, d(2026, 12, 3))).toBe('il 3 dicembre');
    expect(label(3, d(2026, 12, 4))).toBeNull();
    expect(label(5, d(2026, 12, 4))).toBe('il 5 dicembre');
    expect(label(5, d(2026, 12, 6))).toBeNull();
  });

  it('uses the real length of the month for the lead days', () => {
    expect(label(3, d(2026, 10, 29))).toBeNull();
    expect(label(3, d(2026, 10, 30))).toBe('il 3 novembre');
    expect(label(3, d(2026, 10, 31))).toBe('il 3 novembre');
    expect(label(3, d(2027, 2, 26))).toBeNull();
    expect(label(3, d(2027, 2, 27))).toBe('il 3 marzo');
    expect(label(3, d(2028, 2, 28))).toBe('il 3 marzo');
    expect(label(3, d(2028, 2, 27))).toBeNull();
  });

  it('crosses the year boundary', () => {
    expect(label(5, d(2026, 12, 30))).toBe('il 5 gennaio');
    expect(dueDateFor(5, d(2026, 12, 31))?.getFullYear()).toBe(2027);
  });

  it('clamps a due day past the end of the month to its last day', () => {
    expect(label(31, d(2026, 11, 15))).toBe('il 30 novembre');
    expect(label(31, d(2026, 12, 15))).toBe('il 31 dicembre');
    expect(label(30, d(2027, 2, 10))).toBe('il 28 febbraio');
  });

  it('ignores the time of day', () => {
    expect(dueDateFor(3, new Date(2026, 11, 3, 23, 59))).not.toBeNull();
    expect(dueDateFor(3, new Date(2026, 10, 29, 0, 0))).not.toBeNull();
  });
});

describe('dayWithArticle', () => {
  it("uses l' before 1, 8 and 11", () => {
    expect(dayWithArticle(1)).toBe("l'1");
    expect(dayWithArticle(8)).toBe("l'8");
    expect(dayWithArticle(11)).toBe("l'11");
  });
  it('uses il otherwise', () => {
    for (const n of [2, 3, 5, 10, 18, 21, 28, 31]) expect(dayWithArticle(n)).toBe('il ' + n);
  });
  it('builds the full due date label', () => {
    expect(formatDueDate(new Date(2026, 11, 1))).toBe("l'1 dicembre");
    expect(formatDueDate(new Date(2026, 11, 8))).toBe("l'8 dicembre");
    expect(formatDueDate(new Date(2026, 11, 3))).toBe('il 3 dicembre');
  });
});

describe('dueReminders', () => {
  const list = [
    { _k: 'g', n: 'Garage', a: 35, to: 3, ts: 0 },
    { _k: 't', n: 'Rata tv', a: 53, to: 5, ts: 0 },
  ];

  it('returns the due expenses with their date label', () => {
    expect(dueReminders(list, d(2026, 11, 29)).map(r => [r.n, r.dueLabel])).toEqual([
      ['Garage', 'il 3 dicembre'],
      ['Rata tv', 'il 5 dicembre'],
    ]);
    expect(dueReminders(list, d(2026, 12, 4)).map(r => r.n)).toEqual(['Rata tv']);
    expect(dueReminders(list, d(2026, 12, 10))).toEqual([]);
  });

  it('puts the closest due date first, whatever the saved order', () => {
    const saved = [
      { _k: 't', n: 'Rata TV', a: 53, to: 5, ts: 0 },
      { _k: 'g', n: 'Garage', a: 35, to: 3, ts: 0 },
    ];
    expect(dueReminders(saved, d(2026, 11, 3)).map(r => r.n)).toEqual(['Garage', 'Rata TV']);
    expect(dueReminders(saved, d(2026, 11, 30)).map(r => r.n)).toEqual(['Garage', 'Rata TV']);
  });

  it('orders 1, 3, 5 and 8 and drops each one after its due day', () => {
    const saved = [
      { _k: 'o', n: 'Otto', a: 1, to: 8, ts: 0 },
      { _k: 't', n: 'Rata TV', a: 53, to: 5, ts: 0 },
      { _k: 'u', n: 'Uno', a: 1, to: 1, ts: 0 },
      { _k: 'g', n: 'Garage', a: 35, to: 3, ts: 0 },
    ];
    const at = (m: number, day: number) => dueReminders(saved, d(2026, m, day)).map(r => r.dueLabel);
    expect(at(11, 3)).toEqual(['il 3 novembre', 'il 5 novembre', "l'8 novembre"]);
    expect(at(11, 29)).toEqual(["l'1 dicembre", 'il 3 dicembre', 'il 5 dicembre', "l'8 dicembre"]);
    expect(at(12, 2)).toEqual(['il 3 dicembre', 'il 5 dicembre', "l'8 dicembre"]);
    expect(at(12, 6)).toEqual(["l'8 dicembre"]);
    expect(at(12, 9)).toEqual([]);
  });

  it('sorts by actual date, not by day number, across the month change', () => {
    const saved = [
      { _k: 'e', n: 'Fine mese', a: 10, to: 30, ts: 0 },
      { _k: 'g', n: 'Garage', a: 35, to: 3, ts: 0 },
    ];
    expect(dueReminders(saved, d(2026, 11, 29)).map(r => [r.n, r.dueLabel])).toEqual([
      ['Fine mese', 'il 30 novembre'],
      ['Garage', 'il 3 dicembre'],
    ]);
  });
});
