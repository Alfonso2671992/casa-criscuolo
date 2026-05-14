import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  onValue,
  get,
  child,
} from 'firebase/database';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { snap2arr } from './utils';
import { ROOT } from './constants';
import type { Expense, WishItem, Misura, AcquistoItem } from './types';

const firebaseConfig = {
  apiKey: 'AIzaSyCHPWXCOg3lwu6_okAlpUomiGWoJ7f9he8',
  authDomain: 'casa-criscuolo.firebaseapp.com',
  databaseURL: 'https://casa-criscuolo-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'casa-criscuolo',
  storageBucket: 'casa-criscuolo.firebasestorage.app',
  messagingSenderId: '229191200590',
  appId: '1:229191200590:web:3eacdaa52d32780a40381f',
};

export const fbApp = initializeApp(firebaseConfig);
export const db = getDatabase(fbApp);
export const auth = getAuth(fbApp);

export type AuthCallback = (user: User | null) => void;

export function onAuth(cb: AuthCallback) {
  return onAuthStateChanged(auth, cb);
}

export async function login(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function register(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  return signOut(auth);
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export function listenExpenses(cb: (data: Expense[]) => void) {
  const rootRef = ref(db, ROOT + '/exp');
  return onValue(rootRef, (snap) => cb(snap2arr<Expense>(snap.val())));
}

export function listenWishes(cb: (data: WishItem[]) => void) {
  const rootRef = ref(db, ROOT + '/wish');
  return onValue(rootRef, (snap) => cb(snap2arr<WishItem>(snap.val())));
}

export function listenMisure(cb: (data: Misura[]) => void) {
  const rootRef = ref(db, ROOT + '/mis');
  return onValue(rootRef, (snap) => cb(snap2arr<Misura>(snap.val())));
}

export function listenAcquisti(cb: (data: AcquistoItem[]) => void) {
  const rootRef = ref(db, ROOT + '/acquisti');
  return onValue(rootRef, (snap) => cb(snap2arr<AcquistoItem>(snap.val())));
}

export async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const u = auth.currentUser;
  if (!u) throw new Error('Non autenticato');
  const token = await u.getIdToken();
  return fetch(url, {
    ...init,
    headers: { ...init?.headers, Authorization: 'Bearer ' + token },
  });
}

const photoCache = new Map<string, string>();

export async function getPhoto(refKey: string): Promise<string | null> {
  if (photoCache.has(refKey)) return photoCache.get(refKey)!;
  try {
    const snap = await get(child(ref(db), ROOT + '/photos/' + refKey));
    const val = snap.val();
    const url: string | null = val?.data || null;
    if (url) photoCache.set(refKey, url);
    return url;
  } catch { return null; }
}

export function isPhotoRef(p: string | null): boolean {
  return !!p && !p.startsWith('data:');
}

export function isDataUrl(p: string | null): boolean {
  return !!p && p.startsWith('data:');
}
