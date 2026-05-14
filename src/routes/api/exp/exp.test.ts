import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAddExpense = vi.fn();
const mockUpdateExpense = vi.fn();
const mockDeleteExpense = vi.fn();
vi.mock('../../../lib/server/firebase-admin', () => ({
  addExpense: mockAddExpense,
  updateExpense: mockUpdateExpense,
  deleteExpense: mockDeleteExpense,
}));

vi.mock('../../../lib/server/api-utils', () => {
  class ApiError extends Error {
    constructor(public status: number, message: string) { super(message); }
  }
  return {
    apiHandler: vi.fn(async (_req: Request, handler: () => Promise<Response>) => {
      try { return await handler(); }
      catch (e: any) {
        const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
        const status = e?.status || 500;
        return new Response(JSON.stringify({ ok: false, error: msg }), { status, headers: { 'Content-Type': 'application/json' } });
      }
    }),
    ApiError,
  };
});

beforeEach(() => {
  mockAddExpense.mockClear();
  mockUpdateExpense.mockClear();
  mockDeleteExpense.mockClear();
});

const { POST } = await import('./+server');
const { PATCH, DELETE } = await import('./[id]/+server');

describe('POST /api/exp', () => {
  it('creates expense with valid data', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a: '25.50', payer: 'Alfonso', n: 'Cena', c: 'uscite' }),
    });
    const res = await POST({ request: req });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockAddExpense).toHaveBeenCalledOnce();
    const args = mockAddExpense.mock.lastCall[0];
    expect(args.n).toBe('Cena');
    expect(args.a).toBe(25.50);
    expect(args.c).toBe('uscite');
    expect(args.payer).toBe('Alfonso');
    expect(args.s).toBe('da');
    expect(args.ts).toBeGreaterThan(0);
  });

  it('rejects invalid amount', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a: 'abc', payer: 'Alfonso' }),
    });
    const res = await POST({ request: req });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Importo');
  });

  it('rejects empty payer', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a: '10', payer: '' }),
    });
    const res = await POST({ request: req });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('paga');
  });

  it('caps name length to 200', async () => {
    const longName = 'x'.repeat(250);
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a: '10', payer: 'Alina', n: longName, c: 'spesa' }),
    });
    await POST({ request: req });
    const args = mockAddExpense.mock.lastCall[0];
    expect(args.n.length).toBe(200);
  });

  it('defaults category to altro', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a: '10', payer: 'Alfonso' }),
    });
    await POST({ request: req });
    const args = mockAddExpense.mock.lastCall[0];
    expect(args.c).toBe('altro');
  });

  it('calculates half for A metà', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a: '25', payer: 'A metà' }),
    });
    await POST({ request: req });
    const args = mockAddExpense.mock.lastCall[0];
    expect(args.payer).toBe('A metà');
    expect(args.half).toBe(12.5);
  });
});

describe('PATCH /api/exp/[id]', () => {
  it('updates only whitelisted fields', async () => {
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ n: 'New name', a: '50', c: 'luce', s: 'ok', evil: 'injected' }),
    });
    await PATCH({ params: { id: 'abc' }, request: req });
    const args = mockUpdateExpense.mock.calls[0];
    expect(args[0]).toBe('abc');
    expect(args[1].n).toBe('New name');
    expect(args[1].a).toBe(50);
    expect(args[1].s).toBe('ok');
    expect(args[1].evil).toBeUndefined();
  });

  it('rejects invalid amount on PATCH', async () => {
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a: '-5' }),
    });
    const res = await PATCH({ params: { id: 'abc' }, request: req });
    expect(res.status).toBe(400);
  });

  it('rejects invalid status', async () => {
    const req = new Request('http://localhost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ s: 'invalid' }),
    });
    const res = await PATCH({ params: { id: 'abc' }, request: req });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/exp/[id]', () => {
  it('deletes expense by id', async () => {
    const req = new Request('http://localhost', { method: 'DELETE' });
    const res = await DELETE({ params: { id: 'xyz' }, request: req });
    expect(res.status).toBe(200);
    expect(mockDeleteExpense).toHaveBeenCalledWith('xyz');
  });
});
