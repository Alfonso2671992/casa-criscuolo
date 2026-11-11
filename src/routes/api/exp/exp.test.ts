import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAddExpense = vi.fn();
const mockUpdateExpense = vi.fn();
const mockDeleteExpense = vi.fn();
const mockGetExpense = vi.fn();
const mockAddBillRecord = vi.fn();
vi.mock('../../../lib/server/firebase-admin', () => ({
  getExpense: mockGetExpense,
  addBillRecord: mockAddBillRecord,
  addExpense: mockAddExpense,
  updateExpense: mockUpdateExpense,
  deleteExpense: mockDeleteExpense,
}));

const mockSendToOthers = vi.fn();
vi.mock('../../../lib/server/push', async () => {
  const actual = await vi.importActual<typeof import('../../../lib/server/push')>('../../../lib/server/push');
  return { ...actual, sendToOthers: mockSendToOthers };
});

vi.mock('../../../lib/server/api-utils', () => {
  class ApiError extends Error {
    constructor(public status: number, message: string) { super(message); }
  }
  return {
    apiHandler: vi.fn(async (_req: Request, handler: (u: unknown) => Promise<Response>) => {
      try { return await handler({ uid: 'u1', email: 'a@x.it' }); }
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
  mockGetExpense.mockReset();
  mockAddBillRecord.mockReset();
  mockSendToOthers.mockReset();
  mockSendToOthers.mockResolvedValue(undefined);
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
    const res = await POST({ request: req, url: new URL('http://localhost') } as never);
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
    const res = await POST({ request: req, url: new URL('http://localhost') } as never);
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
    const res = await POST({ request: req, url: new URL('http://localhost') } as never);
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
    await POST({ request: req, url: new URL('http://localhost') } as never);
    const args = mockAddExpense.mock.lastCall[0];
    expect(args.n.length).toBe(200);
  });

  it('defaults category to altro', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a: '10', payer: 'Alfonso' }),
    });
    await POST({ request: req, url: new URL('http://localhost') } as never);
    const args = mockAddExpense.mock.lastCall[0];
    expect(args.c).toBe('altro');
  });

  it('calculates half for A metà', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a: '25', payer: 'A metà' }),
    });
    await POST({ request: req, url: new URL('http://localhost') } as never);
    const args = mockAddExpense.mock.lastCall[0];
    expect(args.payer).toBe('A metà');
    expect(args.half).toBe(12.5);
  });
});

describe('POST /api/exp push', () => {
  const mk = (b: unknown) => new Request('http://localhost', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b),
  });

  it('saves and returns ok even if push fails', async () => {
    mockSendToOthers.mockRejectedValue(new Error('fcm down'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await POST({ request: mk({ a: '10', payer: 'Alfonso', n: 'luce' }), url: new URL('http://localhost') } as never);
    expect(await res.json()).toEqual({ ok: true });
    expect(mockAddExpense).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it('notifies others with author name', async () => {
    await POST({ request: mk({ a: '10', payer: 'Alfonso', n: 'luce' }), url: new URL('http://localhost') } as never);
    expect(mockSendToOthers).toHaveBeenCalledOnce();
    const [uid, msg] = mockSendToOthers.mock.lastCall;
    expect(uid).toBe('u1');
    expect(msg.body).toContain('ha aggiunto Luce');
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

  const patch = (body: unknown) => PATCH({ params: { id: 'abc' }, request: new Request('http://localhost', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }) } as never);

  it('recomputes half when the amount of a split expense changes', async () => {
    await patch({ a: 20, payer: 'A metà' });
    expect(mockUpdateExpense.mock.calls[0][1].half).toBe(10);
  });

  it('computes half when an expense becomes split', async () => {
    await patch({ a: 263.49, payer: 'A metà' });
    expect(mockUpdateExpense.mock.calls[0][1].half).toBe(131.75);
  });

  it('clears half when an expense stops being split', async () => {
    await patch({ a: 20, payer: 'Alfonso' });
    expect(mockUpdateExpense.mock.calls[0][1].half).toBeNull();
  });

  it('uses the stored payer when only the amount changes', async () => {
    mockGetExpense.mockResolvedValue({ a: 10, payer: 'A metà' });
    await patch({ a: 30 });
    expect(mockGetExpense).toHaveBeenCalledWith('abc');
    expect(mockUpdateExpense.mock.calls[0][1].half).toBe(15);
  });

  it('uses the stored amount when only the payer changes', async () => {
    mockGetExpense.mockResolvedValue({ a: 50, payer: 'Alina' });
    await patch({ payer: 'A metà' });
    expect(mockUpdateExpense.mock.calls[0][1].half).toBe(25);
  });

  it('ignores a half sent by the client', async () => {
    await patch({ s: 'ok', half: 999 });
    expect(mockUpdateExpense.mock.calls[0][1].half).toBeUndefined();
    expect(mockGetExpense).not.toHaveBeenCalled();
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

  const del = () => DELETE({ params: { id: 'xyz' }, request: new Request('http://localhost', { method: 'DELETE' }) } as never);
  const bill = { n: 'Gas', a: 72.3, c: 'gas', dt: '2026-10-01', sc: '2026-10-20', paidAt: '2026-10-15', payer: 'Alfonso', half: null, s: 'ok', ts: 1 };

  it('archives a paid bill with its due date before deleting it', async () => {
    mockGetExpense.mockResolvedValue(bill);
    const res = await del();
    expect(res.status).toBe(200);
    expect(mockAddBillRecord).toHaveBeenCalledOnce();
    const rec = mockAddBillRecord.mock.lastCall![0];
    expect(rec).toMatchObject({ c: 'gas', n: 'Gas', a: 72.3, d: '2026-10-20' });
    expect(rec.ts).toBeGreaterThan(0);
    expect(mockAddBillRecord.mock.invocationCallOrder[0]).toBeLessThan(mockDeleteExpense.mock.invocationCallOrder[0]);
    expect(mockDeleteExpense).toHaveBeenCalledWith('xyz');
  });

  it('falls back to dt, then paidAt, for the archived date', async () => {
    mockGetExpense.mockResolvedValue({ ...bill, sc: null });
    await del();
    expect(mockAddBillRecord.mock.lastCall![0].d).toBe('2026-10-01');
    mockGetExpense.mockResolvedValue({ ...bill, sc: null, dt: null });
    await del();
    expect(mockAddBillRecord.mock.lastCall![0].d).toBe('2026-10-15');
  });

  it('does not archive an unpaid bill', async () => {
    mockGetExpense.mockResolvedValue({ ...bill, s: 'da' });
    await del();
    expect(mockAddBillRecord).not.toHaveBeenCalled();
    expect(mockDeleteExpense).toHaveBeenCalledWith('xyz');
  });

  it('does not archive a non-bill expense', async () => {
    mockGetExpense.mockResolvedValue({ ...bill, c: 'spesa' });
    await del();
    expect(mockAddBillRecord).not.toHaveBeenCalled();
    expect(mockDeleteExpense).toHaveBeenCalledWith('xyz');
  });

  it('fails without deleting when archiving fails', async () => {
    mockGetExpense.mockResolvedValue(bill);
    mockAddBillRecord.mockRejectedValue(new Error('Firebase 500'));
    const res = await del();
    expect(res.status).toBe(500);
    expect(mockDeleteExpense).not.toHaveBeenCalled();
  });
});
