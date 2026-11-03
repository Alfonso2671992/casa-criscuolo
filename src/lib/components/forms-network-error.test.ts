import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, unmount, flushSync, tick } from 'svelte';
import { get } from 'svelte/store';

const mockAuthFetch = vi.fn();
vi.mock('$lib/firebase-client', () => ({
  authFetch: (...a: unknown[]) => mockAuthFetch(...a),
  getPhoto: async () => null,
  isPhotoRef: () => false,
}));

const { toast } = await import('$lib/stores');

function type(el: Element | null, value: string) {
  const input = el as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

const noop = () => {};

type Case = {
  name: string;
  load: () => Promise<{ default: any }>;
  props?: Record<string, unknown>;
  fill?: (t: HTMLElement) => void;
  button: string;
};

const cases: Case[] = [
  {
    name: 'ExpenseForm',
    load: () => import('./ExpenseForm.svelte'),
    fill: t => {
      type(t.querySelector('input[aria-label="Importo"]'), '12,50');
      (t.querySelector('.payer-btn') as HTMLButtonElement).click();
      flushSync();
    },
    button: 'button.btn-primary',
  },
  {
    name: 'ExpenseEditModal',
    load: () => import('./ExpenseEditModal.svelte'),
    props: { expense: { _k: 'e1', n: 'Pane', a: 3, c: 'altro', payer: 'A metà', dt: '2026-11-03', sc: null }, onClose: noop },
    button: 'button.btn-primary',
  },
  {
    name: 'WishForm',
    load: () => import('./WishForm.svelte'),
    fill: t => type(t.querySelector('input.inp'), 'Lampada da tavolo'),
    button: 'button.btn-primary',
  },
  {
    name: 'WishEditModal',
    load: () => import('./WishEditModal.svelte'),
    props: { wish: { _k: 'w1', n: 'Lampada', c: 'Lampada', d: '', l: '', bgt: null, p: null }, onClose: noop },
    button: 'button.btn-primary',
  },
  {
    name: 'MisuraForm',
    load: () => import('./MisuraForm.svelte'),
    fill: t => type(t.querySelector('input.inp'), 'Divano'),
    button: 'button.btn-primary',
  },
  {
    name: 'MisuraEditModal',
    load: () => import('./MisuraEditModal.svelte'),
    props: { misura: { _k: 'm1', n: 'Divano', l: 200, w: 90, h: 80, note: '', p: null }, onClose: noop },
    button: 'button.btn-primary',
  },
  {
    name: 'RecurringModal',
    load: () => import('./RecurringModal.svelte'),
    props: { onClose: noop },
    fill: t => {
      type(t.querySelector('input[placeholder^="Nome"]'), 'Parcheggio');
      type(t.querySelector('input[placeholder^="Importo"]'), '40');
      type(t.querySelector('#rec-from'), '1');
      type(t.querySelector('#rec-to'), '5');
    },
    button: 'button.btn-add',
  },
];

let target: HTMLElement;
let cmp: Record<string, unknown> | null = null;

beforeEach(() => {
  mockAuthFetch.mockReset();
  toast.set(null);
  target = document.createElement('div');
  document.body.appendChild(target);
});

afterEach(() => {
  if (cmp) unmount(cmp);
  cmp = null;
  target.remove();
});

async function settle() {
  for (let i = 0; i < 5; i++) await tick();
  flushSync();
}

describe.each(cases)('$name', ({ load, props, fill, button }) => {
  async function submit() {
    const { default: C } = await load();
    cmp = mount(C, { target, props: props ?? {} });
    flushSync();
    fill?.(target);
    const btn = target.querySelector(button) as HTMLButtonElement;
    btn.click();
    flushSync();
    return btn;
  }

  it('unlocks the button and shows a toast when the request throws', async () => {
    mockAuthFetch.mockRejectedValue(new TypeError('Load failed'));
    const btn = await submit();
    await settle();
    expect(mockAuthFetch).toHaveBeenCalledTimes(1);
    expect(btn.disabled).toBe(false);
    expect(get(toast)?.msg).toBe('Errore di rete, riprova');
  });

  it('unlocks the button and shows a toast when the server returns an error', async () => {
    mockAuthFetch.mockResolvedValue(new Response('{}', { status: 500 }));
    const btn = await submit();
    await settle();
    expect(btn.disabled).toBe(false);
    expect(get(toast)?.msg).toBe('Errore salvataggio');
  });
});
