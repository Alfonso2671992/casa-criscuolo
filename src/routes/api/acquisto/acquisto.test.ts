import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAddAcquisto = vi.fn();
const mockUpdateAcquisto = vi.fn();
const mockGetAcquisto = vi.fn();
const mockSendToOthers = vi.fn();
vi.mock('../../../lib/server/firebase-admin', () => ({
  addAcquisto: mockAddAcquisto,
  updateAcquisto: mockUpdateAcquisto,
  getAcquisto: mockGetAcquisto,
  deleteAcquisto: vi.fn(),
  deleteAcquistiByCat: vi.fn(),
  restoreAcquisti: vi.fn(),
}));

vi.mock('../../../lib/server/push', async () => {
  const actual = await vi.importActual<typeof import('../../../lib/server/push')>('../../../lib/server/push');
  return { ...actual, sendToOthers: mockSendToOthers };
});

vi.mock('../../../lib/server/api-utils', () => {
  class ApiError extends Error {
    constructor(public status: number, message: string) { super(message); }
  }
  return {
    apiHandler: vi.fn(async (_req: Request, handler: (u: unknown) => Promise<Response>) => handler({ uid: 'u1', email: 'a@x.it' })),
    ApiError,
  };
});

beforeEach(() => {
  mockAddAcquisto.mockClear();
  mockUpdateAcquisto.mockClear();
  mockGetAcquisto.mockReset();
  mockSendToOthers.mockReset();
  mockSendToOthers.mockResolvedValue(undefined);
});

const { POST } = await import('./+server');
const { PATCH } = await import('./[id]/+server');

const req = (body: unknown) => new Request('http://localhost', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

describe('POST /api/acquisto', () => {
  it('adds new items as not urgent', async () => {
    await POST({ request: req({ n: 'limoni', c: 'Spesa', u: true }) } as never);
    expect(mockAddAcquisto.mock.lastCall[0]).toMatchObject({ n: 'Limoni', c: 'Spesa' });
    expect(mockAddAcquisto.mock.lastCall[0]).not.toHaveProperty('u');
  });
});

describe('PATCH /api/acquisto/[id]', () => {
  it('marks an item as urgent', async () => {
    await PATCH({ params: { id: 'k1' }, request: req({ u: true }), url: new URL('http://localhost') } as never);
    expect(mockUpdateAcquisto).toHaveBeenCalledWith('k1', { u: true });
  });

  it('removes the urgent flag with null', async () => {
    await PATCH({ params: { id: 'k1' }, request: req({ u: false }), url: new URL('http://localhost') } as never);
    expect(mockUpdateAcquisto).toHaveBeenCalledWith('k1', { u: null });
  });

  const call = (b: unknown) => PATCH({ params: { id: 'k1' }, request: req(b), url: new URL('http://localhost') } as never);

  it('notifies when an item becomes urgent', async () => {
    mockGetAcquisto.mockResolvedValue({ n: 'limoni', u: undefined });
    await call({ u: true });
    expect(mockSendToOthers).toHaveBeenCalledOnce();
    expect(mockSendToOthers.mock.lastCall[0]).toBe('u1');
  });

  it('does not notify when already urgent', async () => {
    mockGetAcquisto.mockResolvedValue({ n: 'limoni', u: true });
    await call({ u: true });
    expect(mockSendToOthers).not.toHaveBeenCalled();
  });

  it('does not notify when the item does not exist', async () => {
    mockGetAcquisto.mockResolvedValue(null);
    await call({ u: true });
    expect(mockSendToOthers).not.toHaveBeenCalled();
  });

  it('does not read nor notify on u:false', async () => {
    await call({ u: false });
    expect(mockGetAcquisto).not.toHaveBeenCalled();
    expect(mockSendToOthers).not.toHaveBeenCalled();
  });

  it('still saves when getAcquisto rejects', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetAcquisto.mockRejectedValue(new Error('db down'));
    const res = await call({ u: true });
    expect(await res.json()).toEqual({ ok: true });
    expect(mockUpdateAcquisto).toHaveBeenCalledWith('k1', { u: true });
    expect(mockSendToOthers).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('still returns ok when message building throws', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetAcquisto.mockResolvedValue({ n: 123 });
    const res = await call({ u: true });
    expect(await res.json()).toEqual({ ok: true });
    expect(mockUpdateAcquisto).toHaveBeenCalled();
    spy.mockRestore();
  });
});
