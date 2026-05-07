import { json, error } from '@sveltejs/kit';
import { addExpense } from '$lib/server/firebase-admin';
import { cap } from '$lib/utils';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const a = parseFloat(body.a);
    if (isNaN(a) || a <= 0) error(400, 'Importo non valido');
    if (!body.payer) error(400, 'Seleziona chi paga');
    const cat = body.c || 'altro';
    const n = cap((body.n || '').toString().slice(0, 200) || cat);
    const half = body.payer === 'A metà' ? +(a / 2).toFixed(2) : null;
    const dt = body.dt || null;
    const sc = body.sc || null;
    await addExpense({
      n, a, c: cat, dt, sc, payer: body.payer, half, s: 'da', ts: Date.now(),
    });
    return json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
    if (msg.includes('FIREBASE_SERVICE_ACCOUNT'))
      error(500, 'Manca FIREBASE_SERVICE_ACCOUNT. Crea .dev.vars (vedi .dev.vars.example)');
    throw e;
  }
}
