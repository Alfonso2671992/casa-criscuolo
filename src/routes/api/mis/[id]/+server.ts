import { json } from '@sveltejs/kit';
import { apiHandler, ApiError } from '$lib/server/api-utils';
import { updateMisura, deleteMisura } from '$lib/server/firebase-admin';

export async function PATCH({ params, request }) {
  return apiHandler(request, async () => {
    const { id } = params;
    if (!id) throw new ApiError(400, 'ID mancante');
    const body = await request.json();
    await updateMisura(id, body);
    return json({ ok: true });
  });
}

export async function DELETE({ params, request }) {
  return apiHandler(request, async () => {
    const { id } = params;
    if (!id) throw new ApiError(400, 'ID mancante');
    await deleteMisura(id);
    return json({ ok: true });
  });
}
