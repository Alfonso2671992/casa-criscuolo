<script lang="ts">
  import { CASA_CATS, FALLBACK_CASA } from '$lib/constants';
  import { safeUrl, fmtEuro } from '$lib/utils';
  import { showToast, currentModal } from '$lib/stores';
  import { authFetch, getPhoto, isPhotoRef, isDataUrl } from '$lib/firebase-client';
  import type { WishItem } from '$lib/types';

  let { wish }: { wish: WishItem } = $props();
  let photoUrl = $state<string | null>(null);
  const cat = $derived(CASA_CATS.find(c => c.id === wish.c) || FALLBACK_CASA);

  $effect(() => {
    if (isDataUrl(wish.p)) photoUrl = wish.p;
    else if (isPhotoRef(wish.p)) getPhoto(wish.p!.replace('photos/', '')).then(url => photoUrl = url);
    else photoUrl = null;
  });

  async function del() {
    const res = await authFetch(`/api/wish/${wish._k}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!res.ok) showToast('Errore eliminazione');
    currentModal.set(null);
  }
</script>

<div class="card">
  {#if photoUrl}
    <img src={photoUrl} class="photo" alt={wish.n} />
  {:else}
    <div class="photo-ph" style="background:{cat.bg};color:{cat.color}">{@html cat.svg.replace('width="18" height="18"', 'width="26" height="26"')}</div>
  {/if}
  <div class="body">
    <div class="top">
      <span class="name">{wish.n}</span>
      <span class="cat-badge" style="background:{cat.bg};color:{cat.color};border-color:{cat.color}">{wish.c}</span>
    </div>
    {#if wish.d}<div class="detail">{wish.d}</div>{/if}
    {#if wish.bgt}<div class="budget">Budget: €{fmtEuro(wish.bgt)}</div>{/if}
    {#if wish.l && safeUrl(wish.l)}
      <a href={safeUrl(wish.l)} target="_blank" class="link">Apri link →</a>
    {/if}
    <div class="actions">
      <button class="btn-edit" onclick={() => currentModal.set({ type: 'wish-edit', wish })}>Modifica</button>
      <button class="btn-remove" onclick={() => currentModal.set({ type: 'confirm', message: 'Eliminare "' + wish.n + '"?', onConfirm: del, onCancel: () => currentModal.set(null) })}>Rimuovi</button>
    </div>
  </div>
</div>

<style>
  .card { border-radius: 16px; overflow: hidden; border: 1.5px solid var(--border-light); margin-bottom: 10px; }
  .photo { width: 100%; height: 110px; object-fit: cover; display: block; }
  .photo-ph { width: 100%; height: 56px; display: flex; align-items: center; justify-content: center; }
  .body { padding: 10px 13px 12px; }
.top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
  .name { font-size: 14px; font-weight: 600; font-family: var(--font-serif); }
  .cat-badge { font-size: 10px; padding: 3px 9px; border-radius: 20px; flex-shrink: 0; font-weight: 700; border-width: 1px; border-style: solid; }
  .detail { font-size: 12px; color: var(--text-muted); font-weight: 600; margin-bottom: 4px; }
  .budget { font-size: 12px; color: var(--budget-color); font-weight: 700; margin-bottom: 4px; }
  .link { font-size: 12px; color: var(--accent); text-decoration: none; font-weight: 700; display: inline-block; margin-bottom: 6px; }
  .actions { display: flex; gap: 7px; margin-top: 8px; }
  .btn-edit, .btn-remove { all: unset; height: 36px; border-radius: 9px; font-size: 13px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 0 14px; }
  .btn-edit { background: var(--accent); color: var(--color-white); }
  .btn-remove { background: var(--bg-secondary); color: var(--color-brown); }
</style>
