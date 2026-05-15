import { describe, it, expect, beforeAll } from 'vitest';

function b64url(s: string) {
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64decode(s: string): any {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return JSON.parse(atob(s));
}

function makeToken(payload: Record<string, unknown>): string {
  const h = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const p = b64url(JSON.stringify(payload));
  const sig = b64url('fake_signature');
  return h + '.' + p + '.' + sig;
}

function verifyToken(idToken: string): { sub: string; email?: string } | null {
  const parts = idToken.split('.');
  if (parts.length !== 3) return null;
  let p: any;
  try { p = b64decode(parts[1]); } catch { return null; }
  if (!p.sub || !p.exp) return null;
  if (Date.now() > p.exp * 1000) return null;
  if (p.iss !== 'https://securetoken.google.com/casa-criscuolo') return null;
  return { sub: p.sub, email: p.email || undefined };
}

describe('b64url', () => {
  it('encodes to base64url', () => {
    expect(b64url('hello')).toBe('aGVsbG8');
    expect(b64url('{"a":1}')).toBe('eyJhIjoxfQ');
  });

  it('removes padding', () => {
    const result = b64url('test');
    expect(result).not.toContain('=');
  });

  it('replaces + and /', () => {
    const result = b64url('\xfb\xff\xff\xff\xff');
    expect(result).not.toContain('+');
    expect(result).not.toContain('/');
  });
});

describe('b64decode', () => {
  it('decodes base64url to JSON', () => {
    const p = b64decode('eyJzdWIiOiJ1MSIsImV4cCI6OTk5OX0');
    expect(p.sub).toBe('u1');
    expect(p.exp).toBe(9999);
  });

  it('handles base64 padding', () => {
    const p = b64decode('eyJhIjoxfQ==');
    expect(p.a).toBe(1);
  });

  it('rejects invalid JSON', () => {
    expect(() => b64decode('bm90LWpzb24')).toThrow();
  });
});

describe('verifyToken', () => {
  it('returns user for valid token', () => {
    const farFuture = Math.floor(Date.now() / 1000) + 3600;
    const token = makeToken({
      sub: 'user123',
      email: 'test@example.com',
      exp: farFuture,
      iss: 'https://securetoken.google.com/casa-criscuolo',
    });
    const result = verifyToken(token);
    expect(result).toEqual({ sub: 'user123', email: 'test@example.com' });
  });

  it('returns null for expired token', () => {
    const token = makeToken({
      sub: 'user123',
      exp: 1000000,
      iss: 'https://securetoken.google.com/casa-criscuolo',
    });
    expect(verifyToken(token)).toBeNull();
  });

  it('returns null for wrong issuer', () => {
    const farFuture = Math.floor(Date.now() / 1000) + 3600;
    const token = makeToken({
      sub: 'user123',
      exp: farFuture,
      iss: 'https://securetoken.google.com/wrong-project',
    });
    expect(verifyToken(token)).toBeNull();
  });

  it('returns null for malformed token', () => {
    expect(verifyToken('not-a-jwt')).toBeNull();
    expect(verifyToken('a.b')).toBeNull();
    expect(verifyToken('')).toBeNull();
  });

  it('returns null when payload lacks sub', () => {
    const farFuture = Math.floor(Date.now() / 1000) + 3600;
    const token = makeToken({
      exp: farFuture,
      iss: 'https://securetoken.google.com/casa-criscuolo',
    });
    expect(verifyToken(token)).toBeNull();
  });

  it('returns null for invalid JSON payload', () => {
    const h = b64url(JSON.stringify({ alg: 'RS256' }));
    const token = h + '.invalid-json.sig';
    expect(verifyToken(token)).toBeNull();
  });
});

import { requireAuth as ra } from './firebase-admin';
async function requireAuth(headers: Record<string, string>): Promise<string> {
  return ra(new Request('http://localhost', { headers }));
}

function ab2b64(ab: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(ab)));
}

function b64urlFromBuf(ab: ArrayBuffer) {
  return ab2b64(ab).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function wrapSPKIasPEM(spki: ArrayBuffer): string {
  const b64 = ab2b64(spki);
  const lines = ['-----BEGIN PUBLIC KEY-----'];
  for (let i = 0; i < b64.length; i += 64) lines.push(b64.slice(i, i + 64));
  lines.push('-----END PUBLIC KEY-----');
  return lines.join('\n');
}

describe('requireAuth', () => {
  const origFetch = globalThis.fetch;

  it('throws without authorization header', async () => {
    await expect(requireAuth({})).rejects.toThrow('Autenticazione richiesta');
  });

  it('throws with malformed header', async () => {
    await expect(requireAuth({ authorization: 'Basic abc' })).rejects.toThrow('Autenticazione richiesta');
    await expect(requireAuth({ authorization: '' })).rejects.toThrow('Autenticazione richiesta');
  });

  it('throws with expired token', async () => {
    const token = makeToken({
      sub: 'user123',
      exp: 1000000,
      iss: 'https://securetoken.google.com/casa-criscuolo',
    });
    await expect(requireAuth({ authorization: 'Bearer ' + token })).rejects.toThrow('Token non valido o scaduto');
  });

  it('returns uid for valid token', async () => {
    const kp = await crypto.subtle.generateKey(
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) },
      true, ['sign', 'verify']
    );
    const spki = await crypto.subtle.exportKey('spki', kp.publicKey);
    const pem = wrapSPKIasPEM(spki);
    const keysJson = JSON.stringify({ 'test-key-1': pem });

    globalThis.fetch = async (url: RequestInfo | URL) => {
      if (String(url).includes('googleapis.com')) {
        return new Response(keysJson, { headers: { 'cache-control': 'public, max-age=3600' } });
      }
      return origFetch(url);
    };

    const farFuture = Math.floor(Date.now() / 1000) + 3600;
    const header = { alg: 'RS256', typ: 'JWT', kid: 'test-key-1' };
    const payload = { sub: 'user42', email: 'a@b.com', exp: farFuture, iss: 'https://securetoken.google.com/casa-criscuolo' };
    const hB64 = b64url(JSON.stringify(header));
    const pB64 = b64url(JSON.stringify(payload));
    const sigData = new TextEncoder().encode(hB64 + '.' + pB64);
    const sigBytes = await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, kp.privateKey, sigData);
    const sigB64 = b64urlFromBuf(sigBytes);
    const token = hB64 + '.' + pB64 + '.' + sigB64;

    const uid = await requireAuth({ authorization: 'Bearer ' + token });
    expect(uid).toBe('user42');

    globalThis.fetch = origFetch;
  });
});
