import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';

// jsdom has no Web Animations API, which Svelte transitions rely on
// (the animation "finishes" on the next timer tick, so outros complete under fake timers)
Element.prototype.animate = function () {
  const anim = { cancel() {}, finish() {}, onfinish: null as null | (() => void), currentTime: 0, effect: { getComputedTiming: () => ({ progress: 1 }) } };
  setTimeout(() => anim.onfinish?.(), 0);
  return anim as unknown as Animation;
};

const { default: ReminderPopup } = await import('./ReminderPopup.svelte');
const { recurringExpenses } = await import('$lib/stores');

// 4 November 2026: both due in the window (by the 5th and by the 8th)
const NOW = new Date(2026, 10, 4, 10, 0);
const list = [
  { _k: 'b', n: 'Test', a: 55, to: 8, ts: 0 },
  { _k: 'a', n: 'Rata TV', a: 53, to: 5, ts: 0 },
];

let target: HTMLElement;
let cmp: Record<string, unknown> | null = null;

function open() {
  cmp = mount(ReminderPopup, { target });
  flushSync();
}
function close() {
  if (cmp) unmount(cmp);
  cmp = null;
}

const rows = () => [...target.querySelectorAll('.pop li')].map(r => r.textContent?.replace(/\s+/g, ' ').trim());

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  localStorage.clear();
  recurringExpenses.set(list as never);
  target = document.createElement('div');
  document.body.appendChild(target);
});

afterEach(() => {
  close();
  target.remove();
  vi.useRealTimers();
});

describe('ReminderPopup', () => {
  it('lists the due expenses, closest first, on the first opening of the day', () => {
    open();
    expect(rows()).toEqual(['Rata TV 53,00 € · entro il 5 novembre', "Test 55,00 € · entro l'8 novembre"]);
    expect(localStorage.getItem('cc_rem_seen')).toBe('2026-11-04');
  });

  it('does not show again the same day', () => {
    open();
    close();
    open();
    expect(target.querySelector('.pop')).toBeNull();
  });

  it('shows again the next day', () => {
    localStorage.setItem('cc_rem_seen', '2026-11-03');
    open();
    expect(rows()).toHaveLength(2);
  });

  it('closes when tapped', () => {
    open();
    (target.querySelector('.pop') as HTMLElement).click();
    flushSync();
    vi.advanceTimersByTime(1200);
    flushSync();
    expect(target.querySelector('.pop')).toBeNull();
  });

  it('closes by itself after 7 seconds', () => {
    open();
    vi.advanceTimersByTime(6900);
    flushSync();
    expect(target.querySelector('.pop')).toBeTruthy();
    vi.advanceTimersByTime(200);
    flushSync();
    vi.advanceTimersByTime(1200);
    flushSync();
    expect(target.querySelector('.pop')).toBeNull();
  });

  it('waits for the data, then shows', () => {
    recurringExpenses.set([]);
    open();
    expect(target.querySelector('.pop')).toBeNull();
    recurringExpenses.set(list as never);
    flushSync();
    expect(rows()).toHaveLength(2);
  });

  it('shows nothing and does not mark the day when nothing is due', () => {
    recurringExpenses.set([{ _k: 'c', n: 'Garage', a: 35, to: 3, ts: 0 }] as never);
    open();
    expect(target.querySelector('.pop')).toBeNull();
    expect(localStorage.getItem('cc_rem_seen')).toBeNull();
  });
});
