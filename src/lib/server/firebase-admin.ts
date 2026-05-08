import { env } from '$env/dynamic/private';
import { ROOT } from '../constants';
import type { Expense, WishItem, Misura } from '../types';

const DB_URL = 'https://casa-criscuolo-default-rtdb.europe-west1.firebasedatabase.app';

let _sa: { client_email: string; private_key: string; project_id: string } | null = null;
let _token: string | null = null;
let _tokenExp = 0;

function sa() {
  if (!_sa) {
    const json = env.FIREBASE_SERVICE_ACCOUNT;
    if (!json) throw new Error('FIREBASE_SERVICE_ACCOUNT env var not set');
    _sa = JSON.parse(json);
  }
  return _sa;
}

function b64url(s: string) {
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function ab2b64(ab: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(ab)));
}

function pem2ab(pem: string) {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;
}

async function sign(data: string, pem: string): Promise<string> {
  const key = await crypto.subtle.importKey('pkcs8', pem2ab(pem), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  return ab2b64(await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, key, new TextEncoder().encode(data)));
}

async function token(): Promise<string> {
  if (_token && Date.now() < _tokenExp - 60000) return _token;
  const a = sa();
  const now = Math.floor(Date.now() / 1000);
  const jwt = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' })) + '.' + b64url(JSON.stringify({ iss: a.client_email, scope: 'https://www.googleapis.com/auth/database', aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now }));
  const sig = await sign(jwt, a.private_key);
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt + '.' + sig }) });
  const d: any = await r.json();
  _token = d.access_token;
  _tokenExp = Date.now() + (d.expires_in || 3600) * 1000;
  return _token;
}

async function db(method: string, path: string, data?: any) {
  const t = await token();
  const url = `${DB_URL}/${ROOT}/${path}.json?access_token=${t}`;
  const r = await fetch(url, { method, headers: data ? { 'Content-Type': 'application/json' } : undefined, body: data ? JSON.stringify(data) : undefined });
  const txt = await r.text();
  if (!r.ok) throw new Error(`Firebase ${r.status}: ${txt}`);
  return txt ? JSON.parse(txt) : null;
}

export async function addExpense(d: Expense) { d.ts = Date.now(); await db('POST', 'exp', d); }
export async function updateExpense(k: string, d: Partial<Expense>) { await db('PATCH', 'exp/' + k, d); }
export async function deleteExpense(k: string) { await db('DELETE', 'exp/' + k); }
export async function addWish(d: WishItem) { d.ts = Date.now(); await db('POST', 'wish', d); }
export async function updateWish(k: string, d: Partial<WishItem>) { await db('PATCH', 'wish/' + k, d); }
export async function deleteWish(k: string) { await db('DELETE', 'wish/' + k); }
export async function addMisura(d: Misura) { d.ts = Date.now(); await db('POST', 'mis', d); }
export async function deleteMisura(k: string) { await db('DELETE', 'mis/' + k); }
const BUCKET = 'casa-criscuolo.firebasestorage.app';

export async function uploadFile(path: string, file: File): Promise<string> {
  const t = await token();
  const enc = encodeURIComponent(path);
  const url = `https://storage.googleapis.com/upload/storage/v1/b/${BUCKET}/o?uploadType=media&name=${enc}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': file.type || 'application/octet-stream' },
    body: await file.arrayBuffer(),
  });
  if (!r.ok) throw new Error('Storage upload failed: ' + (await r.text()));
  await fetch(`https://storage.googleapis.com/storage/v1/b/${BUCKET}/o/${enc}/acl`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' },
    body: JSON.stringify({ entity: 'allUsers', role: 'READER' }),
  });
  return `https://storage.googleapis.com/${BUCKET}/${path}`;
}
