import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';

vi.mock('$lib/firebase-client', () => ({ authFetch: vi.fn() }));

let target: HTMLElement;
let cmp: Record<string, unknown> | null = null;

async function render(load: () => Promise<{ default: any }>, props: Record<string, unknown> = {}) {
  const { default: C } = await load();
  target = document.createElement('div');
  document.body.appendChild(target);
  cmp = mount(C, { target, props });
  flushSync();
  return [...target.querySelectorAll('.payer-btn span')].map(s => s.textContent);
}

afterEach(() => {
  if (cmp) unmount(cmp);
  cmp = null;
  target.remove();
});

const exp = (payer: string) => ({ _k: 'e1', n: 'Pane', a: 3, c: 'altro', payer, dt: '2026-11-03', sc: null });

describe('"A metà" payer option', () => {
  it('is not offered in the new expense form', async () => {
    const opts = await render(() => import('./ExpenseForm.svelte'));
    expect(opts).toHaveLength(2);
    expect(opts).not.toContain('A metà');
  });

  it('is hidden when editing a regular expense', async () => {
    const opts = await render(() => import('./ExpenseEditModal.svelte'), { expense: exp('Alfonso'), onClose: () => {} });
    expect(opts).not.toContain('A metà');
  });

  it('stays available when editing a legacy split expense', async () => {
    const opts = await render(() => import('./ExpenseEditModal.svelte'), { expense: exp('A metà'), onClose: () => {} });
    expect(opts).toContain('A metà');
  });
});
