import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';

const { default: BillHistoryModal } = await import('./BillHistoryModal.svelte');
const { storico, expenses } = await import('$lib/stores');

const cur = { _k: 'e1', n: 'Gas', a: 90, c: 'gas', dt: null, sc: '2026-11-15', payer: 'Alfonso', half: null, s: 'da' as const, ts: 0 };

let target: HTMLElement;
let cmp: Record<string, unknown> | null = null;

function open() {
  target = document.createElement('div');
  document.body.appendChild(target);
  cmp = mount(BillHistoryModal, { target, props: { expense: cur, onClose: () => {} } });
  flushSync();
}

afterEach(() => {
  if (cmp) unmount(cmp);
  cmp = null;
  target.remove();
});

const text = (sel: string) => target.querySelector(sel)?.textContent?.replace(/\s+/g, ' ').trim();

describe('BillHistoryModal', () => {
  it('shows title, chart and rows newest first, without percentages', () => {
    storico.set([
      { _k: 's1', c: 'gas', n: 'Gas', a: 70, d: '2026-09-10', ts: 0 },
      { _k: 's2', c: 'gas', n: 'Gas', a: 80, d: '2026-10-10', ts: 0 },
      { _k: 's3', c: 'luce', n: 'Luce', a: 999, d: '2026-10-10', ts: 0 },
    ]);
    expenses.set([cur]);
    open();
    expect(text('.modal-title')).toBe('Storico gas');
    expect(target.querySelector('.sub')).toBeNull();
    expect(target.textContent).not.toContain('%');
    const rows = [...target.querySelectorAll('.row')].map(r => r.textContent?.replace(/\s+/g, ' ').trim());
    expect(rows).toEqual(['Da pagare · Novembre 2026 90,00 €', 'Ottobre 2026 80,00 €', 'Settembre 2026 70,00 €']);
    expect(target.querySelector('.row')?.classList.contains('cur')).toBe(true);
    expect([...target.querySelectorAll('.mon')].map(m => m.textContent)).toEqual(['10 set', '10 ott', '15 nov']);
    expect(target.querySelector('.yr')).toBeNull();
    expect(target.querySelector('.empty')).toBeNull();
  });

  it('shows the empty hint with a single entry', () => {
    storico.set([]);
    expenses.set([cur]);
    open();
    expect(target.querySelector('.sub')).toBeNull();
    expect(target.querySelectorAll('.row').length).toBe(1);
    expect(text('.empty')).toContain('Lo storico si riempirà');
  });
});
