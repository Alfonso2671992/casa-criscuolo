import { json } from '@sveltejs/kit';

export async function POST() {
  return json({ ok: false, error: 'L\'upload ora avviene direttamente dal browser.' }, { status: 400 });
}