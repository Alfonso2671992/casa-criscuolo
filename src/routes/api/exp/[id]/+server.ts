import { json } from '@sveltejs/kit';
import { apiHandler, ApiError } from '$lib/server/api-utils';
import { getExpense, updateExpense, deleteExpense } from '$lib/server/firebase-admin';
import { cap, halfOf } from '$lib/utils';

// `half` is not client-writable: it is derived from the amount and the payer below
const VALID_EXP_FIELDS = ['n', 'a', 'c', 'dt', 'sc', 'payer', 's', 'paidAt'];

export async function PATCH({ params, request }) {
  return apiHandler(request, async () => {
    const { id } = params;
    if (!id) throw new ApiError(400, 'ID mancante');
    const body = await request.json();
    const update: Record<string, unknown> = {};
    for (const k of VALID_EXP_FIELDS) {
      if (k in body) {
        if (k === 'n') update.n = cap((body.n || '').toString().slice(0, 200));
        else if (k === 'a') { const v = parseFloat(body.a); if (isNaN(v) || v <= 0) throw new ApiError(400, 'Importo non valido'); update.a = v; }
        else if (k === 'c') update.c = body.c;
        else if (k === 'dt') update.dt = body.dt || null;
        else if (k === 'sc') update.sc = body.sc || null;
        else if (k === 'payer') { if (!body.payer || !body.payer.trim()) throw new ApiError(400, 'Seleziona chi paga'); update.payer = body.payer; }
        else if (k === 's') { if (!['da', 'ok'].includes(body.s)) throw new ApiError(400, 'Stato non valido'); update.s = body.s; }
        else if (k === 'paidAt') update.paidAt = body.paidAt || null;
      }
    }
    if ('a' in update || 'payer' in update) {
      // Only one of the two sent: read the other from the stored expense
      const cur = 'a' in update && 'payer' in update ? null : await getExpense(id);
      const a = (update.a ?? cur?.a) as number | undefined;
      const payer = update.payer ?? cur?.payer;
      update.half = payer === 'A metà' && typeof a === 'number' ? halfOf(a) : null;
    }
    await updateExpense(id, update);
    return json({ ok: true });
  });
}

export async function DELETE({ params, request }) {
  return apiHandler(request, async () => {
    const { id } = params;
    if (!id) throw new ApiError(400, 'ID mancante');
    await deleteExpense(id);
    return json({ ok: true });
  });
}
