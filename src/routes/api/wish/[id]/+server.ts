import { json } from '@sveltejs/kit';
import { apiHandler, ApiError } from '$lib/server/api-utils';
import { updateWish, deleteWish } from '$lib/server/firebase-admin';
import { cap } from '$lib/utils';

const VALID_WISH_FIELDS = ['n', 'c', 'd', 'l', 'bgt', 'p', 'b'];

export async function PATCH({ params, request }) {
  return apiHandler(request, async () => {
    const { id } = params;
    if (!id) throw new ApiError(400, 'ID mancante');
    const body = await request.json();
    const update: Record<string, unknown> = {};
    for (const k of VALID_WISH_FIELDS) {
      if (k in body) {
        if (k === 'n') update.n = cap((body.n || '').toString().slice(0, 200));
        else if (k === 'c') update.c = body.c;
        else if (k === 'd') update.d = (body.d || '').toString().slice(0, 200);
        else if (k === 'l') update.l = (body.l || '').toString().slice(0, 2000);
        else if (k === 'bgt') update.bgt = body.bgt != null ? parseFloat(body.bgt) : null;
        else if (k === 'p') update.p = body.p || null;
        else if (k === 'b') update.b = !!body.b;
      }
    }
    await updateWish(id, update);
    return json({ ok: true });
  });
}

export async function DELETE({ params, request }) {
  return apiHandler(request, async () => {
    const { id } = params;
    if (!id) throw new ApiError(400, 'ID mancante');
    await deleteWish(id);
    return json({ ok: true });
  });
}
