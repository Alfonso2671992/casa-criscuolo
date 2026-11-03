import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAddAcquisto = vi.fn();
const mockUpdateAcquisto = vi.fn();
vi.mock('../../../lib/server/firebase-admin', () => ({
  addAcquisto: mockAddAcquisto,
  updateAcquisto: mockUpdateAcquisto,
  deleteAcquisto: vi.fn(),
  deleteAcquistiByCat: vi.fn(),
  restoreAcquisti: vi.fn(),
}));

vi.mock('../../../lib/server/api-utils', () => {
  class ApiError extends Error {
    constructor(public status: number, message: string) { super(message); }
  }
  return {
    apiHandler: vi.fn(async (_req: Request, handler: () => Promise<Response>) => handler()),
    ApiError,
  };
});

beforeEach(() => {
  mockAddAcquisto.mockClear();
  mockUpdateAcquisto.mockClear();
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
    await PATCH({ params: { id: 'k1' }, request: req({ u: true }) } as never);
    expect(mockUpdateAcquisto).toHaveBeenCalledWith('k1', { u: true });
  });

  it('removes the urgent flag with null', async () => {
    await PATCH({ params: { id: 'k1' }, request: req({ u: false }) } as never);
    expect(mockUpdateAcquisto).toHaveBeenCalledWith('k1', { u: null });
  });
});
