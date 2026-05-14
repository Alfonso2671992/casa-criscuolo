import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetIdToken = vi.fn();
const mockAuth = { currentUser: null };
let mockCurrentUser: any = null;
Object.defineProperty(mockAuth, 'currentUser', { get: () => mockCurrentUser });

vi.mock('firebase/app', () => ({ initializeApp: () => ({}) }));
vi.mock('firebase/database', () => ({ getDatabase: () => ({}), ref: () => ({}), onValue: () => () => {}, get: () => {}, child: () => ({}) }));
vi.mock('firebase/auth', () => ({
  getAuth: () => mockAuth,
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

const { isPhotoRef, isDataUrl, authFetch, getPhoto } = await import('./firebase-client');

describe('isPhotoRef', () => {
  it('returns true for non-data-url string', () => {
    expect(isPhotoRef('photos/abc123')).toBe(true);
  });
  it('returns false for data URL', () => {
    expect(isPhotoRef('data:image/jpeg;base64,/9j/4AAQ')).toBe(false);
  });
  it('returns false for null', () => {
    expect(isPhotoRef(null)).toBe(false);
  });
  it('returns false for empty string', () => {
    expect(isPhotoRef('')).toBe(false);
  });
});

describe('isDataUrl', () => {
  it('returns true for data URL', () => {
    expect(isDataUrl('data:image/jpeg;base64,/9j/4AAQ')).toBe(true);
  });
  it('returns false for photo ref', () => {
    expect(isDataUrl('photos/abc123')).toBe(false);
  });
  it('returns false for null', () => {
    expect(isDataUrl(null)).toBe(false);
  });
});

describe('authFetch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCurrentUser = null;
  });

  it('throws when not authenticated', async () => {
    mockCurrentUser = null;
    await expect(authFetch('/api/test')).rejects.toThrow('Non autenticato');
  });

  it('adds Bearer token and calls fetch', async () => {
    mockGetIdToken.mockResolvedValue('token123');
    mockCurrentUser = { getIdToken: mockGetIdToken };

    const mockFetch = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', mockFetch);

    const res = await authFetch('/api/test', { method: 'POST', body: '{}' });
    expect(res.status).toBe(200);
    expect(mockGetIdToken).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST', body: '{}',
      headers: { Authorization: 'Bearer token123' },
    });
  });

  it('preserves existing headers', async () => {
    mockGetIdToken.mockResolvedValue('tok');
    mockCurrentUser = { getIdToken: mockGetIdToken };
    const mockFetch = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', mockFetch);

    await authFetch('/api/test', { headers: { 'Content-Type': 'application/json' } });
    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok' },
    });
  });
});

describe('getPhoto', () => {
  it('returns null on error', async () => {
    const result = await getPhoto('nonexistent');
    expect(result).toBeNull();
  });
});
