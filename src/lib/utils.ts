import { browser } from '$app/environment';

export function cap(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function esc(s: unknown): string {
  if (typeof s !== 'string') return s != null ? String(s) : '';
  if (!browser) return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

export function safeUrl(s: string): string {
  if (!s) return '';
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : '';
  } catch { return ''; }
}

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function dateToStr(d: Date): string {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

export function strToDisplay(s?: string | null): string {
  if (!s) return '';
  const p = s.split('-');
  return p[2] + '/' + p[1] + '/' + p[0];
}

export function today(): string {
  return dateToStr(new Date());
}

export function daysUntil(s?: string | null): number | null {
  if (!s) return null;
  return Math.round(
    (new Date(s + 'T00:00:00').getTime() - new Date(today() + 'T00:00:00').getTime()) / 86400000
  );
}

export function snap2arr<T extends { ts?: number }>(obj: Record<string, T> | null): (T & { _k: string })[] {
  if (!obj) return [];
  return Object.entries(obj)
    .map(([k, v]) => ({ ...v, _k: k } as T & { _k: string }))
    .sort((a, b) => ((b.ts ?? 0) as number) - ((a.ts ?? 0) as number));
}
