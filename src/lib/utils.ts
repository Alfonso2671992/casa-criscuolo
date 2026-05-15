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

export function sortDaPagare(a: { sc: string | null; dt: string | null }, b: { sc: string | null; dt: string | null }): number {
  if (a.sc && !b.sc) return -1;
  if (!a.sc && b.sc) return 1;
  if (a.sc && b.sc) return a.sc.localeCompare(b.sc);
  return (a.dt ?? '9999-99-99').localeCompare(b.dt ?? '9999-99-99');
}

export function fmtDim(l: number | null, w: number | null, h: number | null): string {
  const parts: string[] = [];
  if (l != null) parts.push('L ' + l + ' cm');
  if (w != null) parts.push('P ' + w + ' cm');
  if (h != null) parts.push('A ' + h + ' cm');
  return parts.join(' × ');
}

export function compressImg(file: File, maxDim = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) { resolve(URL.createObjectURL(file)); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Errore caricamento immagine'));
    const r = new FileReader();
    r.onload = () => { img.src = r.result as string; };
    r.onerror = () => reject(new Error('Errore lettura file'));
    r.readAsDataURL(file);
  });
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function trapFocus(node: HTMLElement) {
  const prev = document.activeElement as HTMLElement | null;
  function handler(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    const els = node.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  setTimeout(() => (node.querySelector<HTMLElement>(FOCUSABLE)?.focus(), 0));
  node.addEventListener('keydown', handler);
  return {
    destroy() { node.removeEventListener('keydown', handler); prev?.focus(); }
  };
}

export function scrollLock(node: HTMLElement) {
  const scrollY = window.scrollY;
  node.style.touchAction = 'none';
  node.style.overscrollBehavior = 'contain';
  const inner = node.querySelector('.box, .modal') as HTMLElement | null;
  if (inner) {
    inner.style.touchAction = 'auto';
    inner.style.overscrollBehavior = 'contain';
  }

  const bodyEl = document.querySelector<HTMLElement>('.body');
  const origOverflow = bodyEl?.style.overflow ?? '';
  if (bodyEl) bodyEl.style.overflow = 'hidden';

  function touchHandler(e: TouchEvent) {
    if (inner && inner.contains(e.target as Node)) return;
    e.preventDefault();
  }
  node.addEventListener('touchmove', touchHandler, { passive: false });

  return {
    destroy() {
      node.style.touchAction = '';
      node.style.overscrollBehavior = '';
      if (inner) {
        inner.style.touchAction = '';
        inner.style.overscrollBehavior = '';
      }
      if (bodyEl) bodyEl.style.overflow = origOverflow;
      node.removeEventListener('touchmove', touchHandler);
    }
  };
}

export function snap2arr<T extends { ts?: number }>(obj: Record<string, T> | null): (T & { _k: string })[] {
  if (!obj) return [];
  return Object.entries(obj)
    .map(([k, v]) => ({ ...v, _k: k } as T & { _k: string }))
    .sort((a, b) => ((b.ts ?? 0) as number) - ((a.ts ?? 0) as number));
}
