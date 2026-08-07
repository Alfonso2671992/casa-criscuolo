import { json } from '@sveltejs/kit';
import { apiHandler, ApiError } from '$lib/server/api-utils';
import { deleteRecurring } from '$lib/server/firebase-admin';

export async function DELETE({ params, request }) {
  return apiHandler(request, async () => {
    const { id } = params;
    if (!id) throw new ApiError(400, 'ID mancante');
    await deleteRecurring(id);
    return json({ ok: true });
  });
}
