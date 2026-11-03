import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, unmount, flushSync, tick } from 'svelte';
import { get } from 'svelte/store';

const mockAuthFetch = vi.fn();
vi.mock('$lib/firebase-client', () => ({ authFetch: (...a: unknown[]) => mockAuthFetch(...a) }));

const { default: AcquistoForm } = await import('./AcquistoForm.svelte');
const { toast } = await import('$lib/stores');

let target: HTMLElement;
let cmp: Record<string, unknown>;

beforeEach(() => {
  mockAuthFetch.mockReset();
  toast.set(null);
  target = document.createElement('div');
  document.body.appendChild(target);
  cmp = mount(AcquistoForm, { target });
});

afterEach(() => {
  unmount(cmp);
  target.remove();
});

async function submitWith(name: string) {
  const input = target.querySelector('input.inp') as HTMLInputElement;
  input.value = name;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
  const btn = target.querySelector('button.btn-primary') as HTMLButtonElement;
  btn.click();
  flushSync();
  return btn;
}

async function settle() {
  for (let i = 0; i < 5; i++) await tick();
  flushSync();
}

describe('AcquistoForm submit', () => {
  it('unlocks the button and shows a toast when the request throws', async () => {
    mockAuthFetch.mockRejectedValue(new TypeError('Load failed'));
    const btn = await submitWith('yogurt');
    await settle();
    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toContain('Aggiungi alla lista');
    expect(get(toast)?.msg).toBe('Errore di rete, riprova');
    expect((target.querySelector('input.inp') as HTMLInputElement).value).toBe('yogurt');
  });

  it('unlocks the button and shows a toast when the server returns an error', async () => {
    mockAuthFetch.mockResolvedValue(new Response('{}', { status: 500 }));
    const btn = await submitWith('yogurt');
    await settle();
    expect(btn.disabled).toBe(false);
    expect(get(toast)?.msg).toBe('Errore salvataggio');
  });

  it('shows the saving state while the request is pending', async () => {
    mockAuthFetch.mockReturnValue(new Promise(() => {}));
    const btn = await submitWith('yogurt');
    await settle();
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toContain('Salvataggio...');
  });

  it('clears the form after a successful save', async () => {
    mockAuthFetch.mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
    const btn = await submitWith('yogurt');
    await settle();
    expect(btn.disabled).toBe(false);
    expect(get(toast)?.msg).toBe('Aggiunto alla lista');
    expect((target.querySelector('input.inp') as HTMLInputElement).value).toBe('');
    expect(JSON.parse(mockAuthFetch.mock.calls[0][1].body).n).toBe('yogurt');
  });
});
