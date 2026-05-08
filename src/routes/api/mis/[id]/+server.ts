import { json, error } from '@sveltejs/kit';
import { deleteMisura, requireAuth } from '$lib/server/firebase-admin';

export async function DELETE({ params, request }) {
  try {
    await requireAuth(request);
    const { id } = params;
    if (!id) error(400, 'ID mancante');
    await deleteMisura(id);
    return json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
    return json({ ok: false, error: msg }, { status: msg.includes('Autenticazione') ? 401 : 500 });
  }
}