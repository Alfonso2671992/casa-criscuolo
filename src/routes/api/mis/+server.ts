import { json } from '@sveltejs/kit';
import { apiHandler, ApiError } from '$lib/server/api-utils';
import { addMisura } from '$lib/server/firebase-admin';
import { cap } from '$lib/utils';

export async function POST({ request }) {
  return apiHandler(request, async () => {
    const body = await request.json();
    const n = cap((body.n || '').toString().slice(0, 200));
    if (!n) throw new ApiError(400, 'Nome richiesto');
    await addMisura({
      n, d: (body.d || '').toString().slice(0, 200),
      note: (body.note || '').toString().slice(0, 500),
      p: body.p || null, ts: Date.now(),
    });
    return json({ ok: true });
  });
}
