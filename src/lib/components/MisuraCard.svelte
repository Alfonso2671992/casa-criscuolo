<script lang="ts">
  import { fmtDim } from '$lib/utils';
  import { showToast, currentModal } from '$lib/stores';
  import { authFetch, getPhoto, isPhotoRef, isDataUrl } from '$lib/firebase-client';
  import type { Misura } from '$lib/types';

  let { misura }: { misura: Misura } = $props();
  let photoUrl = $state<string | null>(null);

  $effect(() => {
    if (isDataUrl(misura.p)) photoUrl = misura.p;
    else if (isPhotoRef(misura.p)) getPhoto(misura.p!.replace('photos/', '')).then(url => photoUrl = url);
    else photoUrl = null;
  });

  let dimDisplay = $derived(fmtDim(misura.l, misura.w, misura.h) || misura.d);

  async function del() {
    const res = await authFetch(`/api/mis/${misura._k}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!res.ok) showToast('Errore eliminazione');
    currentModal.set(null);
  }
</script>

<div class="card">
  {#if photoUrl}
    <img src={photoUrl} class="photo" alt={misura.n} />
  {:else}
    <div class="ph">
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="10" rx="1.5"/><path d="M6 7v3M9 7v2M12 7v3M15 7v2M18 7v3"/></svg>
    </div>
  {/if}
  <div class="body">
    <div class="top">
      <span class="name">{misura.n}</span>
      <div class="top-actions">
        <button class="btn-edit" onclick={() => currentModal.set({ type: 'misura-edit', misura })} aria-label="Modifica">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn-del" onclick={() => currentModal.set({ type: 'confirm', message: 'Eliminare "' + misura.n + '"?', onConfirm: del, onCancel: () => currentModal.set(null) })} aria-label="Elimina misura">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
        </button>
      </div>
    </div>
    {#if dimDisplay}
      <div class="badge">
        <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5"><path d="M4 20h16M4 4v16"/><path d="M8 16V8M12 16v-4M16 16V6"/></svg>
        <span>{dimDisplay}</span>
      </div>
    {/if}
    {#if misura.note}<div class="note">{misura.note}</div>{/if}
  </div>
</div>

<style>
  .card { background: var(--bg-card); border-radius: 16px; overflow: hidden; border: 1.5px solid var(--border-light); margin-bottom: 10px; }
  .photo { width: 100%; height: 110px; object-fit: cover; display: block; }
  .ph { width: 100%; height: 52px; background: var(--photo-ph-bg); display: flex; align-items: center; justify-content: center; }
  .body { padding: 10px 13px 12px; }
  .top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 5px; }
  .name { font-size: 14px; font-weight: 600; color: var(--text-primary); font-family: var(--font-serif); }
  .top-actions { display: flex; gap: 8px; align-items: center; }
  .btn-edit, .btn-del { all: unset; width: 36px; height: 36px; border-radius: 9px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .btn-edit { background: var(--accent); color: var(--color-white); }
  .btn-del { background: var(--badge-bg); color: var(--color-brown); }
  .badge { display: inline-flex; align-items: center; gap: 6px; background: var(--badge-bg); border: 1.5px solid var(--badge-border); border-radius: 9px; padding: 5px 12px; margin-bottom: 5px; }
  .badge span { font-size: 13px; font-weight: 800; color: var(--accent); }
  .note { font-size: 12px; color: var(--text-secondary); font-weight: 500; }
</style>
