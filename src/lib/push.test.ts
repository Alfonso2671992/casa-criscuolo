import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockIsSupported = vi.fn();
const mockGetToken = vi.fn();
const mockDeleteToken = vi.fn();
const mockOnMessage = vi.fn();
const mockAuthFetch = vi.fn();

vi.mock('firebase/messaging', () => ({
  isSupported: () => mockIsSupported(),
  getMessaging: () => ({}),
  getToken: (...a: any[]) => mockGetToken(...a),
  deleteToken: (...a: any[]) => mockDeleteToken(...a),
  onMessage: (...a: any[]) => mockOnMessage(...a),
}));
vi.mock('$lib/firebase-client', () => ({
  fbApp: {},
  authFetch: (...a: any[]) => mockAuthFetch(...a),
}));

const push = await import('./push');

function setPermission(p: string) {
  (globalThis as any).Notification = { requestPermission: vi.fn().mockResolvedValue(p), permission: p };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockAuthFetch.mockResolvedValue({ ok: true });
  (navigator as any).serviceWorker = { register: vi.fn().mockResolvedValue({ scope: '/' }) };
});

describe('tabFromUrl', () => {
  it('accepts valid tabs only', () => {
    expect(push.tabFromUrl('?tab=acquisto')).toBe('acquisto');
    expect(push.tabFromUrl('?tab=hack')).toBeNull();
    expect(push.tabFromUrl('')).toBeNull();
  });
});

describe('pushSupport', () => {
  it('need-home on iPhone outside standalone', async () => {
    mockIsSupported.mockResolvedValue(false);
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)');
    (window as any).matchMedia = () => ({ matches: false });
    expect(await push.pushSupport()).toBe('need-home');
  });
  it('ok when supported', async () => {
    mockIsSupported.mockResolvedValue(true);
    expect(await push.pushSupport()).toBe('ok');
  });
});

describe('enablePush', () => {
  it('denied leaves flag unset', async () => {
    setPermission('denied');
    expect(await push.enablePush()).toBe('denied');
    expect(localStorage.getItem('cc_push')).toBeNull();
  });
  it('granted registers token', async () => {
    setPermission('granted');
    mockGetToken.mockResolvedValue('tok');
    expect(await push.enablePush()).toBe('on');
    const [url, init] = mockAuthFetch.mock.calls[0];
    expect(url).toBe('/api/push');
    expect(JSON.parse(init.body)).toEqual({ action: 'register', token: 'tok' });
    expect(localStorage.getItem('cc_push')).toBe('1');
  });
});

describe('disablePush', () => {
  it('removes flag even when network fails', async () => {
    localStorage.setItem('cc_push', '1');
    setPermission('granted');
    mockGetToken.mockResolvedValue('tok');
    mockAuthFetch.mockRejectedValue(new Error('net'));
    await push.disablePush();
    expect(localStorage.getItem('cc_push')).toBeNull();
  });
});
