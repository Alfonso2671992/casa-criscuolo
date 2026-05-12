import type { AcquistoItem, Category } from './types';

export interface AcquistoGroup {
  cat: Category;
  items: AcquistoItem[];
  activeCount: number;
}

export function groupAcquisti(acquisti: AcquistoItem[], cats: Category[]): AcquistoGroup[] {
  const map = new Map<string, AcquistoItem[]>();
  for (const item of acquisti) {
    const list = map.get(item.c);
    if (list) list.push(item); else map.set(item.c, [item]);
  }
  return cats.map(c => {
    const items = (map.get(c.id) || []).sort((a, b) => a.ts - b.ts);
    return { cat: c, items, activeCount: items.filter(i => !i.b).length };
  }).filter(g => g.items.length > 0);
}
