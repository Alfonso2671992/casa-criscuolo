import { json, error } from '@sveltejs/kit';
import { addExpense } from '$lib/server/firebase-admin';
import { cap } from '$lib/utils';

export async function POST({ request }) {
  let body: any;
  try {
    body = await request.json();
  } catch { return json({ ok: false, step: 'parse' }); }

  const a = parseFloat(body.a);
  if (isNaN(a) || a <= 0) error(400, 'Importo non valido');
  if (!body.payer) error(400, 'Seleziona chi paga');
  const cat = body.c || 'altro';
  const n = cap((body.n || '').toString().slice(0, 200) || cat);
  const half = body.payer === 'A metà' ? +(a / 2).toFixed(2) : null;
  const dt = body.dt || null;
  const sc = body.sc || null;

  let firebaseOk = false;
  let firebaseError = '';
  try {
    await addExpense({
      n, a, c: cat, dt, sc, payer: body.payer, half, s: 'da', ts: Date.now(),
    });
    firebaseOk = true;
  } catch (e: any) {
    firebaseError = e?.message || 'errore sconosciuto';
  }

  return json({ ok: true, firebaseOk, firebaseError });
}
