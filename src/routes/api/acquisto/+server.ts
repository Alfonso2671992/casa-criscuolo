import { json } from '@sveltejs/kit';
import { addAcquisto, requireAuth } from '$lib/server/firebase-admin';
import { cap } from '$lib/utils';

export async function POST({ request }) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const n = cap((body.n || '').toString().slice(0, 200) || 'Oggetto');
    await addAcquisto({
      n, c: body.c || 'Spesa',
      qta: (body.qta || '').toString().slice(0, 50),
      b: false, ts: Date.now(),
    });
    return json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
    return json({ ok: false, error: msg }, { status: msg.includes('Autenticazione') ? 401 : 500 });
  }
}
