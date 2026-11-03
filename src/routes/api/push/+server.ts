import { json } from '@sveltejs/kit';
import { apiHandler, ApiError } from '$lib/server/api-utils';
import { savePushToken, deletePushToken } from '$lib/server/firebase-admin';
import { tokenId, sendToToken, testMsg } from '$lib/server/push';

export async function POST({ request, url }) {
  return apiHandler(request, async (user) => {
    const body = await request.json().catch(() => null);
    const token = body?.token;
    if (typeof token !== 'string' || !token || token.length > 4096) throw new ApiError(400, 'Richiesta non valida');
    if (body.action === 'register') {
      await savePushToken(user.uid, await tokenId(token), token);
    } else if (body.action === 'unregister') {
      await deletePushToken(user.uid, await tokenId(token));
    } else if (body.action === 'test') {
      await sendToToken(user.uid, token, testMsg(), url.origin);
    } else {
      throw new ApiError(400, 'Richiesta non valida');
    }
    return json({ ok: true });
  });
}
