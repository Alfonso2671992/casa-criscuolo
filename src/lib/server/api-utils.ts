import { json } from '@sveltejs/kit';
import { requireAuth } from './firebase-admin';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiHandler(
  request: Request,
  handler: () => Promise<Response>
): Promise<Response> {
  try {
    await requireAuth(request);
    return await handler();
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
    const status = e?.status || (msg.includes('Autenticazione') ? 401 : 500);
    return json({ ok: false, error: msg }, { status });
  }
}
