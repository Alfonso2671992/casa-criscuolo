import { json, error } from '@sveltejs/kit';
import { addWish, requireAuth } from '$lib/server/firebase-admin';
import { cap } from '$lib/utils';

export async function POST({ request }) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const n = cap((body.n || '').toString().slice(0, 200) || (body.c || 'Oggetto'));
    await addWish({
      n, c: body.c || 'Lampada',
      d: (body.d || '').toString().slice(0, 200),
      l: (body.l || '').toString().slice(0, 2000),
      bgt: body.bgt ? parseFloat(body.bgt) : null,
      p: body.p || null, b: false, ts: Date.now(),
    });
    return json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
    return json({ ok: false, error: msg }, { status: msg.includes('Autenticazione') ? 401 : 500 });
  }
}