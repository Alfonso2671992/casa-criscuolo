import { json } from '@sveltejs/kit';
import { apiHandler, ApiError } from '$lib/server/api-utils';
import { updateRecurring, deleteRecurring } from '$lib/server/firebase-admin';
import { cap } from '$lib/utils';

export async function PATCH({ params, request }) {
  return apiHandler(request, async () => {
    const { id } = params;
    if (!id) throw new ApiError(400, 'ID mancante');
    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (body.n !== undefined) update.n = cap((body.n || '').toString().slice(0, 200));
    if (body.a !== undefined) {
      const a = parseFloat(body.a);
      if (isNaN(a) || a < 0) throw new ApiError(400, 'Importo non valido');
      update.a = +a.toFixed(2);
    }
    if (body.from !== undefined) {
      const from = parseInt(body.from);
      if (isNaN(from) || from < 1 || from > 31) throw new ApiError(400, 'Giorno inizio non valido');
      update.from = from;
    }
    if (body.to !== undefined) {
      const to = parseInt(body.to);
      if (isNaN(to) || to < 1 || to > 31) throw new ApiError(400, 'Giorno fine non valido');
      update.to = to;
    }
    await updateRecurring(id, update);
    return json({ ok: true });
  });
}

export async function DELETE({ params, request }) {
  return apiHandler(request, async () => {
    const { id } = params;
    if (!id) throw new ApiError(400, 'ID mancante');
    await deleteRecurring(id);
    return json({ ok: true });
  });
}
