import { getMessaging, getToken, deleteToken, onMessage, isSupported } from 'firebase/messaging';
import { fbApp, authFetch } from '$lib/firebase-client';
import { showToast } from '$lib/stores';
import type { TabId } from '$lib/types';

export const VAPID_KEY = 'BN2WZqHkLc_5LWvMlOmHlt_-EDtdiPvqIIoZh45UeCOtlKgINAdsUmIb7x2RW4xXElto2o6yQ6Y3zezwzxegNtU';

export type PushSupport = 'ok' | 'need-home' | 'unsupported';

const SW_URL = '/firebase-messaging-sw.js';
const TABS: TabId[] = ['spese', 'acquisto', 'casa', 'misure'];

export function tabFromUrl(search: string): TabId | null {
  const t = new URLSearchParams(search).get('tab');
  return TABS.includes(t as TabId) ? (t as TabId) : null;
}

function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || !!window.matchMedia?.('(display-mode: standalone)').matches;
}

export async function pushSupport(): Promise<PushSupport> {
  try {
    if (await isSupported()) return 'ok';
  } catch { /* fall through */ }
  if (/iPhone|iPad/.test(navigator.userAgent) && !isStandalone()) return 'need-home';
  return 'unsupported';
}

export function pushEnabled(): boolean {
  try { return localStorage.getItem('cc_push') === '1'; } catch { return false; }
}

function setFlag(on: boolean) {
  try {
    if (on) localStorage.setItem('cc_push', '1');
    else localStorage.removeItem('cc_push');
  } catch { /* storage unavailable */ }
}

function post(action: 'register' | 'unregister' | 'test', token: string) {
  return authFetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, token }),
  });
}

async function currentToken(): Promise<string> {
  const serviceWorkerRegistration = await navigator.serviceWorker.register(SW_URL);
  return getToken(getMessaging(fbApp), { vapidKey: VAPID_KEY, serviceWorkerRegistration });
}

// Must be called straight from the tap handler: iOS wants requestPermission inside the user gesture
export async function enablePush(): Promise<'on' | 'denied' | 'error'> {
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return 'denied';
    const token = await currentToken();
    if (!token) return 'error';
    const res = await post('register', token);
    if (res && res.ok === false) return 'error';
    setFlag(true);
    return 'on';
  } catch {
    return 'error';
  }
}

export async function disablePush(): Promise<void> {
  try {
    const token = await currentToken();
    if (token) await post('unregister', token);
    await deleteToken(getMessaging(fbApp));
  } catch { /* offline: still turn it off locally */ }
  setFlag(false);
}

export async function refreshPush(): Promise<void> {
  try {
    if (!pushEnabled() || Notification.permission !== 'granted') return;
    const token = await currentToken();
    if (token) await post('register', token);
  } catch { /* ignore */ }
}

export async function sendTestPush(): Promise<boolean> {
  try {
    const token = await currentToken();
    if (!token) return false;
    const res = await post('test', token);
    return !(res && res.ok === false);
  } catch {
    return false;
  }
}

export function listenForeground(): void {
  try {
    onMessage(getMessaging(fbApp), (payload) => {
      const n = payload.notification;
      if (n) showToast(`${n.title ?? ''}: ${n.body ?? ''}`);
    });
  } catch { /* unsupported browser */ }
}
