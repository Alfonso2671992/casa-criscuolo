<script lang="ts">
  import { esc } from '$lib/utils';
  import { showToast } from '$lib/stores';
  import { authFetch } from '$lib/firebase-client';
  import type { CartaItem } from '$lib/types';
  import ConfirmDialog from './ConfirmDialog.svelte';

  let { carta }: { carta: CartaItem } = $props();
  let confirmDel = $state(false);
  let canvas = $state<HTMLCanvasElement | null>(null);

  async function del() {
    const res = await authFetch(`/api/carte/${carta._k}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!res.ok) showToast('Errore eliminazione');
    confirmDel = false;
  }

  $effect(() => {
    if (!canvas || !carta.codice) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, 0, w, h);
    const codice = carta.codice.replace(/\s/g, '');
    if (!codice) return;
    const digits = codice.split('');
    const unit = w / (digits.length * 4 + 10);
    let x = unit * 3;
    ctx.fillStyle = '#000';
    for (const d of digits) {
      const n = parseInt(d, 10);
      const pattern = [1, 1, 2, 1, 1, 1, 2, 2, 1, 2][n] ?? 2;
      for (let i = 0; i < 4; i++) {
        if (i % 2 === 0) {
          ctx.fillRect(x + i * unit, 2, unit * ((pattern >> (3 - i)) & 1 ? 1.5 : 1), h - 4);
        }
      }
      x += unit * 4;
    }
  });

  function copyCodice() {
    navigator.clipboard.writeText(carta.codice).then(
      () => showToast('Codice copiato'),
      () => showToast('Errore copia'),
    );
  }
</script>

<div class="card">
  <div class="top-bar" style="background:{carta.colore}">
    <span class="store-name">{esc(carta.n)}</span>
    {#if carta.note}
      <span class="note-badge">{esc(carta.note)}</span>
    {/if}
  </div>
  <div class="body">
    <div class="codice-wrap" onclick={copyCodice} role="button" tabindex="0" onkeydown={(e) => { if (e.key === 'Enter') copyCodice(); }}>
      <span class="codice">{esc(carta.codice)}</span>
    </div>
    <canvas bind:this={canvas} width="280" height="52" class="barcode"></canvas>
    <div class="actions">
      <button class="btn-del" onclick={() => confirmDel = true}>Elimina</button>
    </div>
  </div>
</div>

{#if confirmDel}
  <ConfirmDialog message={'Eliminare "' + carta.n + '"?'} onConfirm={del} onCancel={() => confirmDel = false} />
{/if}

<style>
  .card { background: var(--bg-card); border-radius: 16px; overflow: hidden; border: 1.5px solid var(--border-light); margin-bottom: 10px; }
  .top-bar { padding: 12px 14px; display: flex; align-items: center; gap: 8px; }
  .store-name { font-size: 15px; font-weight: 800; color: #FFF; text-shadow: 0 1px 2px rgba(0,0,0,.3); }
  .note-badge { font-size: 10px; font-weight: 600; color: rgba(255,255,255,.85); background: rgba(0,0,0,.15); padding: 2px 8px; border-radius: 6px; }
  .body { padding: 12px 14px 10px; }
  .codice-wrap { cursor: pointer; margin-bottom: 8px; }
  .codice {
    font-family: 'Courier New', monospace; font-size: 18px; font-weight: 800;
    color: var(--text-primary); letter-spacing: 3px; word-break: break-all;
  }
  .barcode { width: 100%; height: 44px; border-radius: 6px; background: #FFF; display: block; margin-bottom: 6px; }
  .actions { display: flex; justify-content: flex-end; }
  .btn-del { all: unset; background: var(--badge-bg); border-radius: 7px; padding: 4px 9px; font-size: 11px; color: var(--color-brown); cursor: pointer; font-weight: 700; }
</style>
