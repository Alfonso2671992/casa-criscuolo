import { json, error } from '@sveltejs/kit';

export async function POST({ request }) {
  return json({ hello: 'world', received: true });
}
