import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockIsSupported = vi.fn();
const mockGetToken = vi.fn();
const mockDeleteToken = vi.fn();
const mockAuthFetch = vi.fn();

vi.mock('firebase/messaging', () => ({
  isSupported: () => mockIsSupported(),
  getMessaging: () => ({}),
  getToken: (...a: any[]) => mockGetToken(...a),
  deleteToken: (...a: any[]) => mockDeleteToken(...a),
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

describe('tabFromSwMessage', () => {
  it('reads the tab from an open-tab message only', () => {
    expect(push.tabFromSwMessage({ type: 'open-tab', link: 'https://casa.test/?tab=spese' })).toBe('spese');
    expect(push.tabFromSwMessage({ type: 'open-tab', link: 'https://casa.test/' })).toBeNull();
    expect(push.tabFromSwMessage({ type: 'other', link: 'https://casa.test/?tab=spese' })).toBeNull();
    expect(push.tabFromSwMessage({ type: 'open-tab', link: 42 })).toBeNull();
    expect(push.tabFromSwMessage(null)).toBeNull();
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

describe('disablePush permission guard', () => {
  it('unregisters and deletes the token when granted', async () => {
    localStorage.setItem('cc_push', '1');
    setPermission('granted');
    mockGetToken.mockResolvedValue('tok');
    await push.disablePush();
    expect(JSON.parse(mockAuthFetch.mock.calls[0][1].body)).toEqual({ action: 'unregister', token: 'tok' });
    expect(mockDeleteToken).toHaveBeenCalledOnce();
    expect(localStorage.getItem('cc_push')).toBeNull();
  });
  it('touches no token when permission is not granted', async () => {
    localStorage.setItem('cc_push', '1');
    setPermission('default');
    await push.disablePush();
    expect(mockGetToken).not.toHaveBeenCalled();
    expect(mockAuthFetch).not.toHaveBeenCalled();
    expect(mockDeleteToken).not.toHaveBeenCalled();
    expect((globalThis as any).Notification.requestPermission).not.toHaveBeenCalled();
    expect(localStorage.getItem('cc_push')).toBeNull();
  });
});

describe('unregisterOnLogout', () => {
  it('unregisters and deletes the token when enabled and granted', async () => {
    localStorage.setItem('cc_push', '1');
    setPermission('granted');
    mockGetToken.mockResolvedValue('tok');
    await push.unregisterOnLogout();
    expect(JSON.parse(mockAuthFetch.mock.calls[0][1].body)).toEqual({ action: 'unregister', token: 'tok' });
    expect(mockDeleteToken).toHaveBeenCalledOnce();
    expect(localStorage.getItem('cc_push')).toBeNull();
  });
  it('does nothing remote when push is off, still clears the flag', async () => {
    setPermission('granted');
    await push.unregisterOnLogout();
    expect(mockGetToken).not.toHaveBeenCalled();
    expect(mockAuthFetch).not.toHaveBeenCalled();
  });
  it('does nothing remote when permission is not granted', async () => {
    localStorage.setItem('cc_push', '1');
    setPermission('denied');
    await push.unregisterOnLogout();
    expect(mockGetToken).not.toHaveBeenCalled();
    expect(mockAuthFetch).not.toHaveBeenCalled();
    expect(localStorage.getItem('cc_push')).toBeNull();
  });
  it('never throws and clears the flag on network errors', async () => {
    localStorage.setItem('cc_push', '1');
    setPermission('granted');
    mockGetToken.mockResolvedValue('tok');
    mockAuthFetch.mockRejectedValue(new Error('net'));
    await expect(push.unregisterOnLogout()).resolves.toBeUndefined();
    expect(localStorage.getItem('cc_push')).toBeNull();
  });
  it('never throws when Notification is missing', async () => {
    localStorage.setItem('cc_push', '1');
    delete (globalThis as any).Notification;
    await expect(push.unregisterOnLogout()).resolves.toBeUndefined();
    expect(localStorage.getItem('cc_push')).toBeNull();
  });
});
