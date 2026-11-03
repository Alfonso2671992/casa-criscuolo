import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetPushTokens = vi.fn();
const mockFcmSend = vi.fn();
const mockDeletePushToken = vi.fn();
vi.mock('./firebase-admin', () => ({
  getPushTokens: mockGetPushTokens,
  fcmSend: mockFcmSend,
  deletePushToken: mockDeletePushToken,
}));

const { env } = await import('$env/dynamic/private');
const { expenseMsg, urgentMsg, testMsg, authorName, tokenId, sendToOthers, sendToToken } = await import('./push');

beforeEach(() => {
  mockGetPushTokens.mockReset();
  mockFcmSend.mockReset();
  mockDeletePushToken.mockReset();
  mockFcmSend.mockResolvedValue({ ok: true, status: 200, unregistered: false });
  delete env.NOTIFY_USERS;
});

const msg = expenseMsg('Alina', 'luce', 85);

describe('messages', () => {
  it('expenseMsg', () => {
    expect(msg).toEqual({ title: 'Spesa da pagare', body: 'Alina ha aggiunto Luce · 85,00 €', path: '/?tab=spese' });
  });
  it('urgentMsg', () => {
    expect(urgentMsg('Alina', 'limoni')).toEqual({ title: 'Urgente da acquistare', body: 'Alina ha segnato Limoni come urgente', path: '/?tab=acquisto' });
  });
  it('testMsg path is /', () => {
    expect(testMsg().path).toBe('/');
  });
});

describe('authorName', () => {
  it('maps emails case-insensitively', () => {
    env.NOTIFY_USERS = '{"a@x.it":"Alfonso"}';
    expect(authorName('A@X.it')).toBe('Alfonso');
    expect(authorName('b@x.it')).toBe('Qualcuno');
    expect(authorName(undefined)).toBe('Qualcuno');
  });
  it('falls back on invalid JSON', () => {
    env.NOTIFY_USERS = 'non json';
    expect(authorName('a@x.it')).toBe('Qualcuno');
  });
});

describe('tokenId', () => {
  it('is deterministic 32-char hex', async () => {
    const a = await tokenId('abc');
    expect(await tokenId('abc')).toBe(a);
    expect(a).toHaveLength(32);
    expect(a).toMatch(/^[0-9a-f]+$/);
  });
});

describe('sendToOthers', () => {
  const tokens = { u1: { d1: { t: 'T1', ts: 1 } }, u2: { d2: { t: 'T2', ts: 1 }, d3: { t: 'T3', ts: 1 } } };

  it('sends only to other users', async () => {
    mockGetPushTokens.mockResolvedValue(tokens);
    await sendToOthers('u1', msg, 'https://casa.test');
    expect(mockFcmSend).toHaveBeenCalledTimes(2);
    const sent = mockFcmSend.mock.calls.map(c => c[0]);
    expect(sent.map(m => m.token).sort()).toEqual(['T2', 'T3']);
    expect(sent[0].webpush.fcm_options.link).toBe('https://casa.test/?tab=spese');
    expect(sent[0].notification).toEqual({ title: msg.title, body: msg.body });
  });
  it('deletes unregistered tokens and still sends the rest', async () => {
    mockGetPushTokens.mockResolvedValue(tokens);
    mockFcmSend.mockImplementation(async (m: any) => ({ ok: false, status: m.token === 'T2' ? 404 : 200, unregistered: m.token === 'T2' }));
    await sendToOthers('u1', msg, 'https://casa.test');
    expect(mockDeletePushToken).toHaveBeenCalledWith('u2', 'd2');
    expect(mockDeletePushToken).toHaveBeenCalledTimes(1);
    expect(mockFcmSend).toHaveBeenCalledTimes(2);
  });
  it('does nothing when there are no tokens', async () => {
    mockGetPushTokens.mockResolvedValue(null);
    await expect(sendToOthers('u1', msg, 'https://casa.test')).resolves.toBeUndefined();
    expect(mockFcmSend).not.toHaveBeenCalled();
  });
});

describe('sendToToken', () => {
  it('omits fcm_options on non-https origin', async () => {
    await sendToToken('u1', 'T1', msg, 'http://localhost:5173');
    const m = mockFcmSend.mock.calls[0][0];
    expect(m.token).toBe('T1');
    expect(m.webpush?.fcm_options).toBeUndefined();
  });
});
