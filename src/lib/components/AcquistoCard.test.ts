import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';

const mockAuthFetch = vi.fn();
vi.mock('$lib/firebase-client', () => ({ authFetch: (...a: unknown[]) => mockAuthFetch(...a) }));

const { default: AcquistoCard } = await import('./AcquistoCard.svelte');
const { currentModal } = await import('$lib/stores');
const { get } = await import('svelte/store');

let target: HTMLElement;
let cmp: Record<string, unknown> | null = null;

beforeEach(() => {
  currentModal.set(null);
  mockAuthFetch.mockReset();
  mockAuthFetch.mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
  target = document.createElement('div');
  document.body.appendChild(target);
});

afterEach(() => {
  if (cmp) unmount(cmp);
  cmp = null;
  target.remove();
});

function render(u?: boolean) {
  cmp = mount(AcquistoCard, { target, props: { item: { _k: 'k1', n: 'limoni', c: 'Spesa', ts: 0, ...(u ? { u } : {}) } } });
  flushSync();
}

describe('AcquistoCard urgent', () => {
  it('highlights an urgent item with its badge', () => {
    render(true);
    expect(target.querySelector('.card')?.classList.contains('urgent')).toBe(true);
    expect(target.querySelector('.urgent-badge')?.textContent).toBe('· Urgente');
  });

  it('shows no badge for a normal item', () => {
    render();
    expect(target.querySelector('.card')?.classList.contains('urgent')).toBe(false);
    expect(target.querySelector('.urgent-badge')).toBeNull();
  });

  it('has a single button besides the row: the bin', () => {
    render();
    expect([...target.querySelectorAll('button')].map(b => b.className.split(' ')[0])).toEqual(['main', 'remove']);
  });

  it('asks for confirmation before making an item urgent', async () => {
    render();
    (target.querySelector('button.main') as HTMLButtonElement).click();
    const modal = get(currentModal) as { type: string; message: string; onConfirm: () => Promise<void> };
    expect(modal.type).toBe('confirm');
    expect(modal.message).toBe('Rendere "Limoni" urgente?');
    expect(mockAuthFetch).not.toHaveBeenCalled();
    await modal.onConfirm();
    expect(mockAuthFetch).toHaveBeenCalledWith('/api/acquisto/k1', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ u: true }) }));
    expect(get(currentModal)).toBeNull();
  });

  it('asks for confirmation before removing the urgency', async () => {
    render(true);
    (target.querySelector('button.main') as HTMLButtonElement).click();
    const modal = get(currentModal) as { message: string; onConfirm: () => Promise<void> };
    expect(modal.message).toBe('Togliere l\'urgenza a "Limoni"?');
    await modal.onConfirm();
    expect(JSON.parse(mockAuthFetch.mock.calls[0][1].body)).toEqual({ u: false });
  });

  it('does nothing when the confirmation is cancelled', () => {
    render();
    (target.querySelector('button.main') as HTMLButtonElement).click();
    (get(currentModal) as { onCancel: () => void }).onCancel();
    expect(get(currentModal)).toBeNull();
    expect(mockAuthFetch).not.toHaveBeenCalled();
  });
});
