import { env } from '$env/dynamic/private';
import { ROOT } from '../constants';
import type { Expense, WishItem, Misura, AcquistoItem } from '../types';

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
  return _sa!;
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
  return _token!;
}

async function db(method: string, path: string, data?: any) {
  const t = await token();
  const url = `${DB_URL}/${ROOT}/${path}.json?access_token=${t}`;
  const r = await fetch(url, { method, headers: data ? { 'Content-Type': 'application/json' } : undefined, body: data ? JSON.stringify(data) : undefined });
  const txt = (await r.text()).trim();
  if (!r.ok) throw new Error(`Firebase ${r.status}: ${txt}`);
  if (!txt || txt === 'null') return null;
  try { return JSON.parse(txt); } catch { return null; }
}

function b64urlDecode(s: string): string {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return atob(s);
}

function b64decode(s: string): any {
  return JSON.parse(b64urlDecode(s));
}

let _certsCache: { keys: Record<string, string>; exp: number } | null = null;

async function fetchPublicKeys(): Promise<Record<string, string>> {
  if (_certsCache && Date.now() < _certsCache.exp) return _certsCache.keys;
  const r = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
  const txt = await r.text();
  const keys: Record<string, string> = JSON.parse(txt);
  const cc = r.headers.get('cache-control') || '';
  const maxAge = parseInt(cc.match(/max-age=(\d+)/)?.[1] || '3600', 10);
  _certsCache = { keys, exp: Date.now() + maxAge * 1000 };
  return keys;
}

function derReadLength(buf: Uint8Array, pos: number): { length: number; bytes: number } {
  const b = buf[pos];
  if (!(b & 0x80)) return { length: b, bytes: 1 };
  const n = b & 0x7f;
  let len = 0;
  for (let i = 0; i < n; i++) len = (len << 8) | buf[pos + 1 + i];
  return { length: len, bytes: 1 + n };
}

function derSkipTLV(buf: Uint8Array, pos: number): number {
  const { length, bytes } = derReadLength(buf, pos + 1);
  return pos + 1 + bytes + length;
}

function pemToSPKI(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const der = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  if (pem.includes('BEGIN CERTIFICATE')) {
    let pos = 0;
    pos = derSkipTLV(der, pos);
    const { bytes: tbsLenBytes } = derReadLength(der, pos + 1);
    pos += 1 + tbsLenBytes;
    if (der[pos] === 0xa0) pos = derSkipTLV(der, pos);
    for (let i = 0; i < 5; i++) pos = derSkipTLV(der, pos);
    const spkiStart = pos;
    pos = derSkipTLV(der, pos);
    return der.slice(spkiStart, pos).buffer;
  }
  return der.buffer;
}

let _importedKeys = new Map<string, CryptoKey>();

async function getPublicKey(kid: string): Promise<CryptoKey | null> {
  const cached = _importedKeys.get(kid);
  if (cached) return cached;
  const keys = await fetchPublicKeys();
  const pem = keys[kid];
  if (!pem) return null;
  const spki = pemToSPKI(pem);
  const key = await crypto.subtle.importKey('spki', spki, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  _importedKeys.set(kid, key);
  return key;
}

async function verifyToken(idToken: string): Promise<{ sub: string; email?: string } | null> {
  const parts = idToken.split('.');
  if (parts.length !== 3) return null;
  let header: any, payload: any;
  try { header = b64decode(parts[0]); payload = b64decode(parts[1]); } catch { return null; }
  if (!payload.sub || !payload.exp) return null;
  if (Date.now() > payload.exp * 1000) return null;
  if (payload.iss !== 'https://securetoken.google.com/casa-criscuolo') return null;
  const kid = header.kid;
  if (!kid) return null;
  const key = await getPublicKey(kid);
  if (!key) return null;
  const sig = Uint8Array.from(b64urlDecode(parts[2]), c => c.charCodeAt(0));
  const data = new TextEncoder().encode(parts[0] + '.' + parts[1]);
  const ok = await crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, key, sig, data);
  if (!ok) return null;
  return { sub: payload.sub, email: payload.email || undefined };
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

function isDataUrl(v: string): boolean {
  return typeof v === 'string' && v.startsWith('data:');
}

async function storePhoto(id: string, dataUrl: string): Promise<void> {
  await db('PUT', 'photos/' + id, { data: dataUrl, ts: Date.now() });
}

async function storeItemWithPhoto(path: string, data: Record<string, unknown>): Promise<string | null> {
  const photo = data.p as string | undefined;
  delete data.p;
  data.ts = Date.now();
  const result: any = await db('POST', path, data);
  const key = result?.name || null;
  if (key && photo && isDataUrl(photo)) {
    await storePhoto(key, photo);
    await db('PATCH', path + '/' + key, { p: 'photos/' + key });
  } else if (key && photo) {
    await db('PATCH', path + '/' + key, { p: photo });
  }
  return key;
}

export async function addWish(d: WishItem) {
  return storeItemWithPhoto('wish', d as any);
}
export async function updateWish(k: string, d: Partial<WishItem>) {
  if (d.p && isDataUrl(d.p)) {
    await storePhoto(k, d.p);
    d.p = 'photos/' + k;
  }
  await db('PATCH', 'wish/' + k, d);
}
export async function deleteWish(k: string) { await db('DELETE', 'wish/' + k); await db('DELETE', 'photos/' + k); }

export async function addMisura(d: Misura) {
  return storeItemWithPhoto('mis', d as any);
}
export async function updateMisura(k: string, d: Partial<Misura>) {
  if (d.p && isDataUrl(d.p)) {
    await storePhoto(k, d.p);
    d.p = 'photos/' + k;
  }
  await db('PATCH', 'mis/' + k, d);
}
export async function deleteMisura(k: string) { await db('DELETE', 'mis/' + k); await db('DELETE', 'photos/' + k); }

export async function addAcquisto(d: AcquistoItem) { d.ts = Date.now(); await db('POST', 'acquisti', d); }
export async function updateAcquisto(k: string, d: Partial<AcquistoItem>) { await db('PATCH', 'acquisti/' + k, d); }
export async function deleteAcquisto(k: string) { await db('DELETE', 'acquisti/' + k); }
export async function restoreAcquisti(items: Record<string, AcquistoItem>) {
  for (const [k, v] of Object.entries(items)) {
    await db('PUT', 'acquisti/' + k, v);
  }
}

export async function deleteAcquistiByCat(cat: string): Promise<Record<string, unknown> | null> {
  const all = await db('GET', 'acquisti');
  if (!all) return null;
  const updates: Record<string, null> = {};
  const deleted: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(all)) {
    if ((v as any).c === cat) { updates[k] = null; deleted[k] = v; }
  }
  const keys = Object.keys(updates);
  if (keys.length > 0) await db('PATCH', 'acquisti', updates);
  return deleted;
}

export async function getPhoto(key: string): Promise<string | null> {
  const d: any = await db('GET', 'photos/' + key);
  return d?.data || null;
}

