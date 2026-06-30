import { json } from '@sveltejs/kit';
import { apiHandler, ApiError } from '$lib/server/api-utils';
import { updateAcquisto, deleteAcquisto } from '$lib/server/firebase-admin';
import { cap } from '$lib/utils';

const VALID_ACQ_FIELDS = ['n', 'c', 'qta'];

export async function PATCH({ params, request }) {
  return apiHandler(request, async () => {
    const { id } = params;
    if (!id) throw new ApiError(400, 'ID mancante');
    const body = await request.json();
    const update: Record<string, unknown> = {};
    for (const k of VALID_ACQ_FIELDS) {
      if (k in body) {
        if (k === 'n') update.n = cap((body.n || '').toString().slice(0, 200));
        else if (k === 'c') update.c = body.c;
        else if (k === 'qta') update.qta = (body.qta || '').toString().slice(0, 50);
      }
    }
    await updateAcquisto(id, update);
    return json({ ok: true });
  });
}

export async function DELETE({ params, request }) {
  return apiHandler(request, async () => {
    const { id } = params;
    if (!id) throw new ApiError(400, 'ID mancante');
    await deleteAcquisto(id);
    return json({ ok: true });
  });
}
