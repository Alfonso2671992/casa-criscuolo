import { json } from '@sveltejs/kit';
import { addAcquisto, deleteAcquistiByCat, requireAuth } from '$lib/server/firebase-admin';
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

export async function DELETE({ request }) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const cat = (body.c || '').toString();
    if (!cat) return json({ ok: false, error: 'Categoria mancante' }, { status: 400 });
    await deleteAcquistiByCat(cat);
    return json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
    return json({ ok: false, error: msg }, { status: msg.includes('Autenticazione') ? 401 : 500 });
  }
}
