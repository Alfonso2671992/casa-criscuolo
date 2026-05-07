import { json, error } from '@sveltejs/kit';
import { deleteMisura } from '$lib/server/firebase-admin';

export async function DELETE({ params }) {
  const { id } = params;
  if (!id) error(400, 'ID mancante');
  await deleteMisura(id);
  return json({ ok: true });
}
