import { json, error } from '@sveltejs/kit';
import { uploadFile } from '$lib/server/firebase-admin';
import { ROOT } from '$lib/constants';

export async function POST({ request }) {
  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;
    const folder = (form.get('folder') as string) || 'general';
    if (!file || file.size === 0) error(400, 'File mancante');
    if (file.size > 5 * 1024 * 1024) error(400, 'File troppo grande (max 5MB)');
    const ext = file.name.split('.').pop() || 'jpg';
    const name = Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.' + ext;
    const path = ROOT + '/photos/' + folder + '/' + name;
    const url = await uploadFile(path, file);
    return json({ url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
    return json({ ok: false, error: msg }, { status: 500 });
  }
}