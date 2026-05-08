<script lang="ts">
  import { CASA_CATS } from '$lib/constants';
  import { esc, safeUrl } from '$lib/utils';
  import { showToast } from '$lib/stores';
  import { authFetch } from '$lib/firebase-client';
  import type { WishItem } from '$lib/types';
  import WishEditModal from './WishEditModal.svelte';

  let { wish }: { wish: WishItem } = $props();
  let showEdit = $state(false);
  const cat = $derived(CASA_CATS.find(c => c.id === wish.c) || CASA_CATS[5]);

  async function toggle() {
    const res = await authFetch(`/api/wish/${wish._k}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ b: !wish.b }),
    });
    if (!res.ok) showToast('Errore aggiornamento');
  }

  async function del() {
    const res = await authFetch(`/api/wish/${wish._k}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!res.ok) showToast('Errore eliminazione');
  }
</script>

<div class="card" class:bought={wish.b}>
  {#if wish.p}
    <img src={wish.p} class="photo" alt={wish.n} />
  {:else}
    <div class="photo-ph" style="background:{cat.bg};color:{cat.color}">{@html cat.svg.replace('width="18" height="18"', 'width="26" height="26"')}</div>
  {/if}
  <div class="body">
    {#if wish.b}<span class="bought-badge">✓ Comprato</span>{/if}
    <div class="top">
      <span class="name" style="color:{wish.b ? 'var(--color-green-dark)' : 'var(--text-primary)'}">{esc(wish.n)}</span>
      <span class="cat-badge" style="background:{cat.bg};color:{cat.color};border-color:{cat.color}">{esc(wish.c)}</span>
    </div>
    {#if wish.d}<div class="detail">{esc(wish.d)}</div>{/if}
    {#if wish.bgt}<div class="budget">Budget: €{wish.bgt}</div>{/if}
    {#if wish.l && safeUrl(wish.l)}
      <a href={safeUrl(wish.l)} target="_blank" class="link">Apri link →</a>
    {/if}
    <div class="actions">
      <button class="btn-edit" onclick={() => showEdit = true}>Modifica</button>
      <button class="btn-remove" onclick={del}>Rimuovi</button>
      <button class="btn-bought" style="background:{wish.b ? 'var(--text-muted)' : 'var(--color-green)'}" onclick={toggle}>{wish.b ? 'Annulla' : 'Segna comprato'}</button>
    </div>
  </div>
</div>

{#if showEdit}
  <WishEditModal {wish} onClose={() => showEdit = false} />
{/if}

<style>
  .card { border-radius: 16px; overflow: hidden; border: 1.5px solid var(--border-light); margin-bottom: 10px; }
  .card.bought { border-color: var(--bought-border); background: var(--bought-card-bg); }
  .photo { width: 100%; height: 110px; object-fit: cover; display: block; }
  .photo-ph { width: 100%; height: 56px; display: flex; align-items: center; justify-content: center; }
  .body { padding: 10px 13px 12px; }
  .bought-badge { font-size: 11px; color: var(--color-white); font-weight: 700; background: var(--color-green); padding: 3px 10px; border-radius: 20px; display: inline-block; margin-bottom: 6px; }
  .top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
  .name { font-size: 14px; font-weight: 700; font-family: Georgia, serif; }
  .cat-badge { font-size: 10px; padding: 3px 9px; border-radius: 20px; flex-shrink: 0; font-weight: 700; border-width: 1px; border-style: solid; }
  .detail { font-size: 12px; color: var(--text-muted); font-weight: 600; margin-bottom: 4px; }
  .budget { font-size: 12px; color: var(--budget-color); font-weight: 700; margin-bottom: 4px; }
  .link { font-size: 12px; color: var(--accent); text-decoration: none; font-weight: 700; display: inline-block; margin-bottom: 6px; }
  .actions { display: flex; gap: 7px; margin-top: 8px; }
  .btn-edit, .btn-remove { all: unset; background: var(--accent); color: var(--color-white); border-radius: 9px; padding: 7px 13px; font-size: 12px; cursor: pointer; font-weight: 700; display: inline-block; }
  .btn-bought { all: unset; border-radius: 9px; padding: 7px 13px; font-size: 12px; cursor: pointer; font-weight: 700; display: inline-block; color: var(--color-white); }
</style>
