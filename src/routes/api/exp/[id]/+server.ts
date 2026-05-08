import { json, error } from '@sveltejs/kit';
import { updateExpense, deleteExpense } from '$lib/server/firebase-admin';

export async function PATCH({ params, request }) {
  try {
    const { id } = params;
    if (!id) error(400, 'ID mancante');
    const body = await request.json();
    await updateExpense(id, body);
    return json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
    return json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function DELETE({ params }) {
  try {
    const { id } = params;
    if (!id) error(400, 'ID mancante');
    await deleteExpense(id);
    return json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
    return json({ ok: false, error: msg }, { status: 500 });
  }
}