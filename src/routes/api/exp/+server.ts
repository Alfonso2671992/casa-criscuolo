import { json } from '@sveltejs/kit';
import { apiHandler, ApiError } from '$lib/server/api-utils';
import { addExpense } from '$lib/server/firebase-admin';
import { cap } from '$lib/utils';

export async function POST({ request }) {
  return apiHandler(request, async () => {
    const body = await request.json();
    const a = parseFloat(body.a);
    if (isNaN(a) || a <= 0) throw new ApiError(400, 'Importo non valido');
    if (!body.payer || !body.payer.trim()) throw new ApiError(400, 'Seleziona chi paga');
    const cat = body.c || 'altro';
    const n = cap((body.n || '').toString().slice(0, 200) || cat);
    const half = body.payer === 'A metà' ? +(a / 2).toFixed(2) : null;
    await addExpense({
      n, a, c: cat, dt: body.dt || null, sc: body.sc || null, payer: body.payer, half, s: 'da', ts: Date.now(),
    });
    return json({ ok: true });
  });
}
