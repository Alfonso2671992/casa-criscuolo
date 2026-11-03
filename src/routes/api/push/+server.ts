import { json } from '@sveltejs/kit';
import { apiHandler, ApiError } from '$lib/server/api-utils';
import { savePushToken, deletePushToken, getPushTokens } from '$lib/server/firebase-admin';
import { tokenId, sendToToken, testMsg } from '$lib/server/push';

export async function POST({ request, url }) {
  return apiHandler(request, async (user) => {
    const body = await request.json().catch(() => null);
    const token = body?.token;
    if (typeof token !== 'string' || !token || token.length > 4096) throw new ApiError(400, 'Richiesta non valida');
    const id = await tokenId(token);
    if (body.action === 'register') {
      // One device = one owner: drop the same token left under another account (e.g. a missed logout)
      const all = await getPushTokens();
      for (const [uid, devs] of Object.entries(all ?? {})) {
        if (uid !== user.uid && devs?.[id]) await deletePushToken(uid, id);
      }
      await savePushToken(user.uid, id, token);
    } else if (body.action === 'unregister') {
      await deletePushToken(user.uid, id);
    } else if (body.action === 'test') {
      const all = await getPushTokens();
      if (!all?.[user.uid]?.[id]) throw new ApiError(400, 'Richiesta non valida');
      await sendToToken(user.uid, token, testMsg(), url.origin);
    } else {
      throw new ApiError(400, 'Richiesta non valida');
    }
    return json({ ok: true });
  });
}
