import { json, error } from '@sveltejs/kit';
import { deleteMisura } from '$lib/server/firebase-admin';

export async function DELETE({ params }) {
  try {
    const { id } = params;
    if (!id) error(400, 'ID mancante');
    await deleteMisura(id);
    return json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
    return json({ ok: false, error: msg }, { status: 500 });
  }
}