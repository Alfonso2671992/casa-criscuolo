import { json, error } from '@sveltejs/kit';
import { updateExpense, deleteExpense } from '$lib/server/firebase-admin';

export async function PATCH({ params, request }) {
  const { id } = params;
  if (!id) error(400, 'ID mancante');
  const body = await request.json();
  await updateExpense(id, body);
  return json({ ok: true });
}

export async function DELETE({ params }) {
  const { id } = params;
  if (!id) error(400, 'ID mancante');
  await deleteExpense(id);
  return json({ ok: true });
}
