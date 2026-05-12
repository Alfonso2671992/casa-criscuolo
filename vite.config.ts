import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { readFileSync } from 'fs';

try {
  const raw = readFileSync('.dev.vars', 'utf-8').trim();
  const eqIdx = raw.indexOf('=');
  if (eqIdx > 0) process.env[raw.slice(0, eqIdx)] = raw.slice(eqIdx + 1);
} catch {}

export default defineConfig({
  plugins: [sveltekit()]
});
