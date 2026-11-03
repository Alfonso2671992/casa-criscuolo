import { json } from '@sveltejs/kit';
import { apiHandler, ApiError } from '$lib/server/api-utils';
import { updateAcquisto, deleteAcquisto, getAcquisto } from '$lib/server/firebase-admin';
import { cap } from '$lib/utils';
import { background, sendToOthers, urgentMsg, authorName } from '$lib/server/push';

const VALID_ACQ_FIELDS = ['n', 'c', 'u'];

export async function PATCH({ params, request, platform, url }) {
  return apiHandler(request, async (user) => {
    const { id } = params;
    if (!id) throw new ApiError(400, 'ID mancante');
    const body = await request.json();
    const update: Record<string, unknown> = {};
    for (const k of VALID_ACQ_FIELDS) {
      if (k in body) {
        if (k === 'n') update.n = cap((body.n || '').toString().slice(0, 200));
        else if (k === 'c') update.c = body.c;
        // null removes the field in a Firebase PATCH
        else if (k === 'u') update.u = body.u === true ? true : null;
      }
    }
    let prev: Awaited<ReturnType<typeof getAcquisto>> = null;
    if (body.u === true) {
      try { prev = await getAcquisto(id); } catch (e) { console.error('push', e); }
    }
    await updateAcquisto(id, update);
    if (prev && prev.u !== true) {
      await background(platform, (async () => sendToOthers(user.uid, urgentMsg(authorName(user.email), prev.n), url.origin))());
    }
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
