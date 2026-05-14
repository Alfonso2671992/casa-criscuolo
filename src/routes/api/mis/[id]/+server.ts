import { json } from '@sveltejs/kit';
import { apiHandler, ApiError } from '$lib/server/api-utils';
import { updateMisura, deleteMisura } from '$lib/server/firebase-admin';
import { cap } from '$lib/utils';

const VALID_MIS_FIELDS = ['n', 'd', 'l', 'w', 'h', 'note', 'p'];

export async function PATCH({ params, request }) {
  return apiHandler(request, async () => {
    const { id } = params;
    if (!id) throw new ApiError(400, 'ID mancante');
    const body = await request.json();
    const update: Record<string, unknown> = {};
    for (const k of VALID_MIS_FIELDS) {
      if (k in body) {
        if (k === 'n') update.n = cap((body.n || '').toString().slice(0, 200));
        else if (k === 'd') update.d = (body.d || '').toString().slice(0, 200);
        else if (k === 'l') update.l = body.l != null ? Math.max(0, +body.l) : null;
        else if (k === 'w') update.w = body.w != null ? Math.max(0, +body.w) : null;
        else if (k === 'h') update.h = body.h != null ? Math.max(0, +body.h) : null;
        else if (k === 'note') update.note = (body.note || '').toString().slice(0, 500);
        else if (k === 'p') update.p = body.p || null;
      }
    }
    await updateMisura(id, update);
    return json({ ok: true });
  });
}

export async function DELETE({ params, request }) {
  return apiHandler(request, async () => {
    const { id } = params;
    if (!id) throw new ApiError(400, 'ID mancante');
    await deleteMisura(id);
    return json({ ok: true });
  });
}
