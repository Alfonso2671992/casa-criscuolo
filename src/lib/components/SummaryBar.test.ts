import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import { get } from 'svelte/store';

// jsdom has no Web Animations API, which Svelte transitions rely on
Element.prototype.animate ??= function () {
  return { cancel() {}, finish() {}, onfinish: null, currentTime: 0, effect: { getComputedTiming: () => ({ progress: 1 }) } } as unknown as Animation;
};

const { default: SummaryBar } = await import('./SummaryBar.svelte');
const { reminderQueue } = await import('$lib/stores');

const due = [
  { _k: 'a', n: 'Garage', a: 35, to: 3, ts: 0, dueLabel: 'il 3 dicembre' },
  { _k: 'b', n: 'Rata tv', a: 53, to: 5, ts: 0, dueLabel: 'il 5 dicembre' },
];

let target: HTMLElement;
let cmp: Record<string, unknown>;

beforeEach(() => {
  vi.useFakeTimers();
  reminderQueue.set([]);
  target = document.createElement('div');
  document.body.appendChild(target);
  cmp = mount(SummaryBar, { target });
});

afterEach(() => {
  unmount(cmp);
  target.remove();
  vi.useRealTimers();
});

describe('SummaryBar reminders', () => {
  it('lists every due expense in a single box', () => {
    reminderQueue.set(due as never);
    flushSync();
    expect(target.querySelectorAll('.reminder')).toHaveLength(1);
    const rows = [...target.querySelectorAll('.rem-row')].map(r => r.textContent?.replace(/\s+/g, ' ').trim());
    expect(rows).toEqual(['Garage 35,00 € · entro il 3 dicembre', 'Rata tv 53,00 € · entro il 5 dicembre']);
  });

  it('keeps the euro sign on the same line as the amount', () => {
    reminderQueue.set(due as never);
    flushSync();
    expect(target.querySelector('.rem-amt')?.textContent).toBe('35,00\u00a0€');
  });

  it('closes on tap', () => {
    reminderQueue.set(due as never);
    flushSync();
    (target.querySelector('.reminder') as HTMLButtonElement).click();
    flushSync();
    expect(get(reminderQueue)).toEqual([]);
  });

  it('closes by itself after 8 seconds', () => {
    reminderQueue.set(due as never);
    flushSync();
    vi.advanceTimersByTime(7900);
    expect(get(reminderQueue)).toHaveLength(2);
    vi.advanceTimersByTime(200);
    expect(get(reminderQueue)).toEqual([]);
  });
});
