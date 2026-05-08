import { json, error } from '@sveltejs/kit';
import { addExpense, requireAuth } from '$lib/server/firebase-admin';
import { cap } from '$lib/utils';

export async function POST({ request }) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const a = parseFloat(body.a);
    if (isNaN(a) || a <= 0) error(400, 'Importo non valido');
    if (!body.payer) error(400, 'Seleziona chi paga');
    const cat = body.c || 'altro';
    const n = cap((body.n || '').toString().slice(0, 200) || cat);
    const half = body.payer === 'A metà' ? +(a / 2).toFixed(2) : null;
    await addExpense({
      n, a, c: cat, dt: body.dt || null, sc: body.sc || null, payer: body.payer, half, s: 'da', ts: Date.now(),
    });
    return json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
    return json({ ok: false, error: msg }, { status: e instanceof Error && e.message.includes('Autenticazione') ? 401 : 500 });
  }
}