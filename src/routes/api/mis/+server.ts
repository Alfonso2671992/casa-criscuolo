import { json, error } from '@sveltejs/kit';
import { addMisura } from '$lib/server/firebase-admin';
import { cap } from '$lib/utils';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const n = cap((body.n || '').toString().slice(0, 200));
    if (!n) error(400, 'Nome richiesto');
    await addMisura({
      n, d: (body.d || '').toString().slice(0, 200),
      note: (body.note || '').toString().slice(0, 500),
      p: body.p || null, ts: Date.now(),
    });
    return json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
    return json({ ok: false, error: msg }, { status: 500 });
  }
}