import { json } from '@sveltejs/kit';
import { testToken } from '$lib/server/firebase-admin';

export async function GET() {
  try {
    const msg = await testToken();
    return json({ ok: true, msg });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}