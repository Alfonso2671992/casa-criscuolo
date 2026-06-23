import { describe, it, expect } from 'vitest';
import { groupAcquisti } from './group-acquisti';
import { ACQUISTO_CATS } from './constants';
import type { AcquistoItem } from './types';

function item(overrides: Partial<AcquistoItem> & { _k: string }): AcquistoItem & { _k: string } {
  return { n: 'test', c: 'Spesa', b: false, qta: '1', ts: 100, ...overrides };
}

describe('groupAcquisti', () => {
  it('groups items by category', () => {
    const items = [
      item({ _k: 'a', c: 'Spesa', n: 'Pomodori' }),
      item({ _k: 'b', c: 'Igiene', n: 'Dentifricio' }),
      item({ _k: 'c', c: 'Spesa', n: 'Pasta' }),
    ];
    const groups = groupAcquisti(items, ACQUISTO_CATS);
    expect(groups).toHaveLength(2);
    expect(groups[0].cat.id).toBe('Spesa');
    expect(groups[0].items.map(i => i.n)).toEqual(['Pomodori', 'Pasta']);
    expect(groups[1].cat.id).toBe('Igiene');
  });

  it('activeCount equals total items (bought state ignored)', () => {
    const items = [
      item({ _k: 'a', c: 'Spesa', n: 'Pomodori', b: false }),
      item({ _k: 'b', c: 'Spesa', n: 'Pasta', b: true }),
      item({ _k: 'c', c: 'Spesa', n: 'Latte', b: false }),
    ];
    const groups = groupAcquisti(items, ACQUISTO_CATS);
    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(3);
    expect(groups[0].activeCount).toBe(3);
  });

  it('activeCount equals items.length when none bought', () => {
    const items = [
      item({ _k: 'a', c: 'Spesa', n: 'Pomodori', b: false }),
      item({ _k: 'b', c: 'Spesa', n: 'Pasta', b: false }),
    ];
    const groups = groupAcquisti(items, ACQUISTO_CATS);
    expect(groups[0].activeCount).toBe(2);
    expect(groups[0].activeCount).toBe(groups[0].items.length);
  });

  it('sorts items by timestamp ascending', () => {
    const items = [
      item({ _k: 'c', c: 'Spesa', n: 'Latte', ts: 300 }),
      item({ _k: 'a', c: 'Spesa', n: 'Pomodori', ts: 100 }),
      item({ _k: 'b', c: 'Spesa', n: 'Pasta', ts: 200 }),
    ];
    const groups = groupAcquisti(items, ACQUISTO_CATS);
    expect(groups[0].items.map(i => i.n)).toEqual(['Pomodori', 'Pasta', 'Latte']);
  });

  it('omits categories with no items', () => {
    const items = [item({ _k: 'a', c: 'Spesa', n: 'Pomodori' })];
    const groups = groupAcquisti(items, ACQUISTO_CATS);
    expect(groups).toHaveLength(1);
    expect(groups[0].cat.id).toBe('Spesa');
  });

  it('returns empty array when no items at all', () => {
    const groups = groupAcquisti([], ACQUISTO_CATS);
    expect(groups).toEqual([]);
  });

  it('handles items in different categories correctly', () => {
    const items = [
      item({ _k: 'a', c: 'Spesa', n: 'Pomodori', b: true }),
      item({ _k: 'b', c: 'Igiene', n: 'Dentifricio', b: false }),
      item({ _k: 'c', c: 'Pulizia', n: 'Sgrassatore', b: false }),
      item({ _k: 'd', c: 'Spesa', n: 'Pasta', b: false }),
    ];
    const groups = groupAcquisti(items, ACQUISTO_CATS);
    expect(groups).toHaveLength(3);
    const spesa = groups.find(g => g.cat.id === 'Spesa')!;
    expect(spesa.activeCount).toBe(2);
    const igiene = groups.find(g => g.cat.id === 'Igiene')!;
    expect(igiene.activeCount).toBe(1);
    const pulizia = groups.find(g => g.cat.id === 'Pulizia')!;
    expect(pulizia.activeCount).toBe(1);
  });
});
