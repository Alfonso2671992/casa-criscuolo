import { json } from '@sveltejs/kit';
import { apiHandler } from '$lib/server/api-utils';
import { addWish } from '$lib/server/firebase-admin';
import { cap } from '$lib/utils';

export async function POST({ request }) {
  return apiHandler(request, async () => {
    const body = await request.json();
    const n = cap((body.n || '').toString().slice(0, 200) || (body.c || 'Oggetto'));
    const bgtRaw = body.bgt ? parseFloat(body.bgt) : null;
    const bgt = bgtRaw !== null && !isNaN(bgtRaw) && bgtRaw >= 0 ? +bgtRaw.toFixed(2) : null;
    await addWish({
      n, c: body.c || 'Lampada',
      d: (body.d || '').toString().slice(0, 200),
      l: (body.l || '').toString().slice(0, 2000),
      bgt, p: body.p || null, ts: Date.now(),
    });
    return json({ ok: true });
  });
}
