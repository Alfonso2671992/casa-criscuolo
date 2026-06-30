import { writable, derived } from 'svelte/store';
import type { Expense, WishItem, Misura, AcquistoItem, TabId, Names, ModalState } from './types';
import type { User } from 'firebase/auth';

function lsNames(): Names {
  try {
    const n = localStorage.getItem('cc_n');
    if (n) return JSON.parse(n);
  } catch {}
  return { p1: 'Alfonso', p2: 'Alina' };
}

function lsCache<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

export const expenses = writable<Expense[]>(lsCache<Expense[]>('cc_e', []));
export const wishes = writable<WishItem[]>(lsCache<WishItem[]>('cc_w', []));
export const misure = writable<Misura[]>(lsCache<Misura[]>('cc_m', []));
export const acquisti = writable<AcquistoItem[]>(lsCache<AcquistoItem[]>('cc_a', []));
export const user = writable<User | null>(null);
export const currentTab = writable<TabId>('spese');
export const names = writable<Names>(lsNames());
export interface ToastMsg {
  msg: string;
  action?: { label: string; fn: () => void };
}
export const toast = writable<ToastMsg | null>(null);
let _toastTimer: ReturnType<typeof setTimeout> | null = null;

export const totalUnpaid = derived(expenses, ($e) =>
  $e.filter((e) => e.s === 'da').reduce((s, e) => s + e.a, 0)
);
export const totalPaid = derived(expenses, ($e) =>
  $e.filter((e) => e.s === 'ok').reduce((s, e) => s + e.a, 0)
);

export function showToast(msg: string, duration = 3000, action?: { label: string; fn: () => void }) {
  if (_toastTimer) clearTimeout(_toastTimer);
  toast.set({ msg, action });
  if (duration > 0) _toastTimer = setTimeout(() => toast.set(null), duration);
}

export function cacheExpenses(data: Expense[]) {
  expenses.set(data);
  try { localStorage.setItem('cc_e', JSON.stringify(data)); } catch {}
}

export function cacheWishes(data: WishItem[]) {
  wishes.set(data);
  try { localStorage.setItem('cc_w', JSON.stringify(data)); } catch {}
}

export function cacheMisure(data: Misura[]) {
  misure.set(data);
  try { localStorage.setItem('cc_m', JSON.stringify(data)); } catch {}
}

export function cacheAcquisti(data: AcquistoItem[]) {
  acquisti.set(data);
  try { localStorage.setItem('cc_a', JSON.stringify(data)); } catch {}
}

function lsDark(): boolean {
  try {
    return localStorage.getItem('cc_dark') === 'true';
  } catch { return false; }
}

export const darkMode = writable<boolean>(lsDark());

export function initDark() {
  const d = lsDark();
  darkMode.set(d);
  document.documentElement.setAttribute('data-theme', d ? 'dark' : 'light');
}

export const currentModal = writable<ModalState>(null);


