import { json } from '@sveltejs/kit';
import { apiHandler, ApiError } from '$lib/server/api-utils';
import { addRecurring } from '$lib/server/firebase-admin';
import { cap } from '$lib/utils';

export async function POST({ request }) {
  return apiHandler(request, async () => {
    const body = await request.json();
    const n = cap((body.n || '').toString().slice(0, 200));
    if (!n) throw new ApiError(400, 'Nome mancante');
    const a = parseFloat(body.a);
    if (isNaN(a) || a < 0) throw new ApiError(400, 'Importo non valido');
    const from = parseInt(body.from);
    const to = parseInt(body.to);
    if (isNaN(from) || from < 1 || from > 31) throw new ApiError(400, 'Giorno inizio non valido');
    if (isNaN(to) || to < from || to > 31) throw new ApiError(400, 'Giorno fine non valido');
    await addRecurring({ n, a: +a.toFixed(2), from, to, ts: Date.now() });
    return json({ ok: true });
  });
}
