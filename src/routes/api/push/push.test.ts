import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSave = vi.fn();
const mockDelete = vi.fn();
const mockGetTokens = vi.fn();
vi.mock('../../../lib/server/firebase-admin', () => ({
  savePushToken: mockSave,
  deletePushToken: mockDelete,
  getPushTokens: mockGetTokens,
}));

vi.mock('../../../lib/server/api-utils', () => {
  class ApiError extends Error {
    constructor(public status: number, message: string) { super(message); }
  }
  return {
    apiHandler: vi.fn(async (_req: Request, handler: (u: unknown) => Promise<Response>) => {
      try { return await handler({ uid: 'u1', email: 'a@x.it' }); }
      catch (e: any) {
        return new Response(JSON.stringify({ ok: false, error: e.message }), { status: e?.status || 500 });
      }
    }),
    ApiError,
  };
});

beforeEach(() => {
  mockSave.mockReset();
  mockDelete.mockReset();
  mockGetTokens.mockReset();
  mockGetTokens.mockResolvedValue(null);
});

const { tokenId } = await import('../../../lib/server/push');

const { POST } = await import('./+server');

const call = (b: unknown) => POST({
  request: new Request('http://localhost', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }),
  url: new URL('http://localhost'),
} as never);

describe('POST /api/push', () => {
  it('registers a token', async () => {
    const res = await call({ action: 'register', token: 'tok' });
    expect(res.status).toBe(200);
    expect(mockSave).toHaveBeenCalledWith('u1', expect.stringMatching(/^[0-9a-f]{32}$/), 'tok');
  });

  it('moves a token registered under another uid to the caller', async () => {
    const id = await tokenId('tok');
    mockGetTokens.mockResolvedValue({
      u2: { [id]: { t: 'tok', ts: 1 }, other: { t: 'x', ts: 1 } },
      u3: { other: { t: 'y', ts: 1 } },
      u1: { [id]: { t: 'tok', ts: 1 } },
    });
    const res = await call({ action: 'register', token: 'tok' });
    expect(res.status).toBe(200);
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledWith('u2', id);
    expect(mockSave).toHaveBeenCalledWith('u1', id, 'tok');
    expect(mockDelete.mock.invocationCallOrder[0]).toBeLessThan(mockSave.mock.invocationCallOrder[0]);
  });

  it('unregisters a token', async () => {
    await call({ action: 'unregister', token: 'tok' });
    expect(mockDelete).toHaveBeenCalledWith('u1', expect.stringMatching(/^[0-9a-f]{32}$/));
  });

  it('rejects unknown action, test included', async () => {
    expect((await call({ action: 'x', token: 'tok' })).status).toBe(400);
    const res = await call({ action: 'test', token: 'tok' });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'Richiesta non valida' });
  });

  it('rejects missing or oversized token', async () => {
    expect((await call({ action: 'register' })).status).toBe(400);
    expect((await call({ action: 'register', token: 'x'.repeat(4097) })).status).toBe(400);
  });
});
