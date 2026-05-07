import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase, type Database } from 'firebase-admin/database';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { env } from '$env/dynamic/private';
import { ROOT } from '../constants';
import type { Expense, WishItem, Misura } from '../types';

let _db: Database | null = null;
let _auth: Auth | null = null;
let _storage: Storage | null = null;

function init() {
  if (_db) return;
  const json = env.FIREBASE_SERVICE_ACCOUNT;
  if (!json) throw new Error('FIREBASE_SERVICE_ACCOUNT env var not set');
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert(JSON.parse(json)),
        databaseURL: 'https://casa-criscuolo-default-rtdb.europe-west1.firebasedatabase.app',
        storageBucket: 'casa-criscuolo.firebasestorage.app',
      });
  _db = getDatabase(app);
  _auth = getAuth(app);
  _storage = getStorage(app);
}

async function dbRef(path: string) {
  init();
  return _db!.ref(path);
}

export async function verifyToken(token: string) {
  init();
  try {
    return await _auth!.verifyIdToken(token);
  } catch {
    return null;
  }
}

export async function addExpense(data: Expense): Promise<void> {
  data.ts = Date.now();
  const ref = await dbRef(ROOT + '/exp');
  ref.push().set(data);
}

export async function updateExpense(key: string, data: Partial<Expense>): Promise<void> {
  const ref = await dbRef(ROOT + '/exp/' + key);
  ref.update(data);
}

export async function deleteExpense(key: string): Promise<void> {
  const ref = await dbRef(ROOT + '/exp/' + key);
  ref.remove();
}

export async function addWish(data: WishItem): Promise<void> {
  data.ts = Date.now();
  const ref = await dbRef(ROOT + '/wish');
  ref.push().set(data);
}

export async function updateWish(key: string, data: Partial<WishItem>): Promise<void> {
  const ref = await dbRef(ROOT + '/wish/' + key);
  ref.update(data);
}

export async function deleteWish(key: string): Promise<void> {
  const ref = await dbRef(ROOT + '/wish/' + key);
  ref.remove();
}

export async function addMisura(data: Misura): Promise<void> {
  data.ts = Date.now();
  const ref = await dbRef(ROOT + '/mis');
  ref.push().set(data);
}

export async function deleteMisura(key: string): Promise<void> {
  const ref = await dbRef(ROOT + '/mis/' + key);
  ref.remove();
}

export async function getBucket() {
  init();
  return _storage!.bucket();
}
