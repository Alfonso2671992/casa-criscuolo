import { json } from '@sveltejs/kit';
import { apiHandler, ApiError } from '$lib/server/api-utils';
import { addMisura } from '$lib/server/firebase-admin';
import { cap, fmtDim } from '$lib/utils';

export async function POST({ request }) {
  return apiHandler(request, async () => {
    const body = await request.json();
    const n = cap((body.n || '').toString().slice(0, 200));
    if (!n) throw new ApiError(400, 'Nome richiesto');
    const l = body.l != null ? Math.max(0, +body.l) : null;
    const w = body.w != null ? Math.max(0, +body.w) : null;
    const h = body.h != null ? Math.max(0, +body.h) : null;
    const unit = (body.unit || 'cm').toString().slice(0, 5);
    const d = fmtDim(l, w, h, unit) || (body.d || '').toString().slice(0, 200);
    await addMisura({
      n, d, l, w, h, unit,
      note: (body.note || '').toString().slice(0, 500),
      p: body.p || null, ts: Date.now(),
    });
    return json({ ok: true });
  });
}
