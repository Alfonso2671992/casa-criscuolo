import { env } from '$env/dynamic/private';
import { fmtEuro, cap } from '../utils';
import { getPushTokens, fcmSend, deletePushToken } from './firebase-admin';

export interface PushMsg { title: string; body: string; path: string }

export function authorName(email?: string): string {
  if (!email) return 'Qualcuno';
  try {
    const map = JSON.parse(env.NOTIFY_USERS || '') as Record<string, string>;
    const e = email.toLowerCase();
    for (const [k, v] of Object.entries(map)) {
      if (k.toLowerCase() === e && typeof v === 'string' && v) return v;
    }
  } catch { /* invalid or missing config */ }
  return 'Qualcuno';
}

export function expenseMsg(author: string, n: string, a: number): PushMsg {
  return { title: 'Spesa da pagare', body: `${author} ha aggiunto ${cap(n)} · ${fmtEuro(a)} €`, path: '/?tab=spese' };
}

export function urgentMsg(author: string, n: string): PushMsg {
  return { title: 'Urgente da acquistare', body: `${author} ha segnato ${cap(n)} come urgente`, path: '/?tab=acquisto' };
}

export function testMsg(): PushMsg {
  return { title: 'Casa Criscuolo', body: 'Notifiche attive su questo dispositivo', path: '/' };
}

export async function tokenId(t: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  const hex = Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
  return hex.slice(0, 32);
}

function build(t: string, msg: PushMsg, origin: string) {
  const m: Record<string, unknown> = { token: t, notification: { title: msg.title, body: msg.body } };
  if (origin.startsWith('https://')) m.webpush = { fcm_options: { link: origin + msg.path } };
  return m;
}

async function sendOne(uid: string, id: string, t: string, msg: PushMsg, origin: string) {
  const r = await fcmSend(build(t, msg, origin));
  if (r.unregistered) await deletePushToken(uid, id);
}

export async function sendToOthers(authorUid: string, msg: PushMsg, origin: string): Promise<void> {
  const all = await getPushTokens();
  if (!all) return;
  const jobs: Promise<void>[] = [];
  for (const [uid, devs] of Object.entries(all)) {
    if (uid === authorUid || !devs) continue;
    for (const [id, d] of Object.entries(devs)) jobs.push(sendOne(uid, id, d.t, msg, origin));
  }
  await Promise.allSettled(jobs);
}

export async function sendToToken(uid: string, t: string, msg: PushMsg, origin: string): Promise<void> {
  await sendOne(uid, await tokenId(t), t, msg, origin);
}
