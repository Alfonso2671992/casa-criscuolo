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
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({ iss: a.client_email, scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/devstorage.full_control', aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now }));
  const jwt = header + '.' + payload;
  let sig: string;
  try { sig = await sign(jwt, a.private_key); } catch (e: any) { throw new Error('JWT sign failed: ' + (e?.message || e)); }
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt + '.' + sig }) });
  const txt = await r.text();
  if (!r.ok) throw new Error('Token exchange failed (' + r.status + '): ' + txt);
  const d: any = JSON.parse(txt);
  if (!d.access_token) throw new Error('No access_token in response: ' + txt);
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

let _pubKeys: Record<string, string> | null = null;
let _pubKeysExp = 0;

async function verifyToken(idToken: string): Promise<{ sub: string; email?: string } | null> {
  const [header, payload, signature] = idToken.split('.');
  if (!header || !payload || !signature) return null;
  let h: any, p: any;
  try { h = JSON.parse(atob(header.replace(/-/g, '+').replace(/_/g, '/'))); p = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))); } catch { return null; }
  if (!h.kid || Date.now() > p.exp * 1000) return null;

  if (!_pubKeys || Date.now() > _pubKeysExp) {
    const r = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com/casa-criscuolo');
    const txt = await r.text();
    const cache = r.headers.get('cache-control') || '';
    const maxAge = parseInt(cache.match(/max-age=(\d+)/)?.[1] || '3600');
    _pubKeys = JSON.parse(txt);
    _pubKeysExp = Date.now() + maxAge * 1000;
  }
  const pem = _pubKeys[h.kid];
  if (!pem) return null;

  const key = await crypto.subtle.importKey('spki', pem2ab(pem), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, key, base64url2ab(signature), new TextEncoder().encode(header + '.' + payload));
  if (!ok) return null;
  return { sub: p.sub, email: p.email || undefined };
}

function base64url2ab(s: string): ArrayBuffer {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Uint8Array.from(atob(s), c => c.charCodeAt(0)).buffer;
}

export async function requireAuth(request: Request): Promise<string> {
  const ah = request.headers.get('authorization');
  if (!ah || !ah.startsWith('Bearer ')) throw new Error('Autenticazione richiesta');
  const user = await verifyToken(ah.slice(7));
  if (!user) throw new Error('Token non valido o scaduto');
  return user.sub;
}

export async function addExpense(d: Expense) { d.ts = Date.now(); await db('POST', 'exp', d); }
export async function updateExpense(k: string, d: Partial<Expense>) { await db('PATCH', 'exp/' + k, d); }
export async function deleteExpense(k: string) { await db('DELETE', 'exp/' + k); }
export async function addWish(d: WishItem) { d.ts = Date.now(); await db('POST', 'wish', d); }
export async function updateWish(k: string, d: Partial<WishItem>) { await db('PATCH', 'wish/' + k, d); }
export async function deleteWish(k: string) { await db('DELETE', 'wish/' + k); }
export async function addMisura(d: Misura) { d.ts = Date.now(); await db('POST', 'mis', d); }
export async function deleteMisura(k: string) { await db('DELETE', 'mis/' + k); }

