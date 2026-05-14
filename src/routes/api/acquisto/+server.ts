import { json } from '@sveltejs/kit';
import { apiHandler, ApiError } from '$lib/server/api-utils';
import { addAcquisto, deleteAcquistiByCat, restoreAcquisti } from '$lib/server/firebase-admin';
import { cap } from '$lib/utils';

export async function POST({ request }) {
  return apiHandler(request, async () => {
    const body = await request.json();
    if (body.action === 'restore' && body.items) {
      await restoreAcquisti(body.items);
      return json({ ok: true });
    }
    const n = cap((body.n || '').toString().slice(0, 200) || 'Oggetto');
    await addAcquisto({
      n, c: body.c || 'Spesa',
      qta: (body.qta || '').toString().slice(0, 50),
      b: false, ts: Date.now(),
    });
    return json({ ok: true });
  });
}

export async function DELETE({ request }) {
  return apiHandler(request, async () => {
    const body = await request.json();
    const cat = (body.c || '').toString();
    if (!cat) throw new ApiError(400, 'Categoria mancante');
    const deleted = await deleteAcquistiByCat(cat);
    return json({ ok: true, deleted });
  });
}
