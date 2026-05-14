import { describe, it, expect, vi } from 'vitest';

const mockRequireAuth = vi.fn();
vi.mock('./firebase-admin', () => ({
  requireAuth: mockRequireAuth,
}));

const { apiHandler, ApiError } = await import('./api-utils');

describe('ApiError', () => {
  it('sets status and message', () => {
    const e = new ApiError(400, 'Bad request');
    expect(e.status).toBe(400);
    expect(e.message).toBe('Bad request');
    expect(e).toBeInstanceOf(Error);
  });
});

describe('apiHandler', () => {
  function req(headers = {}): Request {
    return new Request('http://localhost', { headers });
  }

  it('returns handler response when auth succeeds', async () => {
    mockRequireAuth.mockResolvedValue('uid1');
    const res = await apiHandler(req(), async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('returns 401 when requireAuth throws auth error', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Autenticazione richiesta'));
    const res = await apiHandler(req(), async () => new Response('{}', { status: 200 }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Autenticazione richiesta');
  });

  it('returns 500 for non-auth errors', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Internal server blooper'));
    const res = await apiHandler(req(), async () => new Response('{}', { status: 200 }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Internal server blooper');
  });

  it('uses ApiError status when thrown from handler', async () => {
    mockRequireAuth.mockResolvedValue('uid1');
    const res = await apiHandler(req(), async () => { throw new ApiError(400, 'Importo non valido'); });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Importo non valido');
  });

  it('handles non-Error throws gracefully', async () => {
    mockRequireAuth.mockResolvedValue('uid1');
    const res = await apiHandler(req(), async () => { throw 'string error'; });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Errore sconosciuto');
  });

  it('handles handler rejection', async () => {
    mockRequireAuth.mockResolvedValue('uid1');
    const res = await apiHandler(req(), async () => { throw new Error('Handler failed'); });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });
});
