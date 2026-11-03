import { json } from '@sveltejs/kit';
import { requireAuth, type AuthUser } from './firebase-admin';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiHandler(
  request: Request,
  handler: (user: AuthUser) => Promise<Response>
): Promise<Response> {
  try {
    const user = await requireAuth(request);
    return await handler(user);
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
    const status = e?.status || (msg.includes('Autenticazione') ? 401 : 500);
    return json({ ok: false, error: msg }, { status });
  }
}
