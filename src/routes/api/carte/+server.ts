import { json } from '@sveltejs/kit';
import { apiHandler, ApiError } from '$lib/server/api-utils';
import { addCarta } from '$lib/server/firebase-admin';
import { cap } from '$lib/utils';

export async function POST({ request }) {
  return apiHandler(request, async () => {
    const body = await request.json();
    const n = cap((body.n || '').toString().slice(0, 100));
    if (!n) throw new ApiError(400, 'Nome richiesto');
    await addCarta({
      n,
      codice: (body.codice || '').toString().slice(0, 100),
      colore: (body.colore || '#C4622D').toString().slice(0, 7),
      note: (body.note || '').toString().slice(0, 500),
      ts: Date.now(),
    });
    return json({ ok: true });
  });
}
