import type { AcquistoItem, Category } from './types';

export interface AcquistoGroup {
  cat: Category;
  items: AcquistoItem[];
  activeCount: number;
  urgentCount: number;
}

export function groupAcquisti(acquisti: AcquistoItem[], cats: Category[]): AcquistoGroup[] {
  const map = new Map<string, AcquistoItem[]>();
  for (const item of acquisti) {
    const list = map.get(item.c);
    if (list) list.push(item); else map.set(item.c, [item]);
  }
  return cats.map(c => {
    // Urgent items first, then oldest first
    const items = (map.get(c.id) || []).sort((a, b) => Number(!!b.u) - Number(!!a.u) || a.ts - b.ts);
    return { cat: c, items, activeCount: items.length, urgentCount: items.filter(i => i.u).length };
  }).filter(g => g.items.length > 0);
}
