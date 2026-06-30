<script lang="ts">
  import { ACQUISTO_CATS, FALLBACK_ACQ } from '$lib/constants';
  import { showToast, currentModal } from '$lib/stores';
  import { authFetch } from '$lib/firebase-client';
  import type { AcquistoItem } from '$lib/types';

  let { item }: { item: AcquistoItem } = $props();

  const cat = $derived(ACQUISTO_CATS.find(c => c.id === item.c) || FALLBACK_ACQ);

  async function del() {
    const res = await authFetch(`/api/acquisto/${item._k}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!res.ok) showToast('Errore eliminazione');
    currentModal.set(null);
  }
</script>

<div class="card">
  <div class="left">
    <div class="cat-icon" style="background:{cat.bg};color:{cat.color}">{@html cat.svg.replace('width="18" height="18"', 'width="20" height="20"')}</div>
  </div>
  <div class="center">
    <div class="name">{item.n}</div>
  </div>
  {#if item.qta}
    <div class="qta-badge">{item.qta}</div>
  {/if}
  <button class="remove" onclick={() => currentModal.set({ type: 'confirm', message: 'Rimuovere "' + item.n + '"?', onConfirm: del, onCancel: () => currentModal.set(null) })} aria-label="Rimuovi">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
  </button>
</div>

<style>
  .card {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 12px; border-radius: 14px;
    background: var(--bg-card); border: 1.5px solid var(--border-light);
    margin-bottom: 6px;
  }
  .left { flex-shrink: 0; }
  .cat-icon {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
  }
  .center { flex: 1; min-width: 0; }
  .name { font-size: 14px; font-weight: 700; font-family: Georgia, serif; color: var(--text-primary); }
  .qta-badge {
    font-size: 11px; font-weight: 800; color: var(--accent);
    background: var(--bg-secondary); padding: 4px 12px; border-radius: 20px;
    white-space: nowrap; flex-shrink: 0;
  }
  .remove {
    all: unset; width: 36px; height: 36px; border-radius: 9px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg-secondary); color: var(--color-brown); flex-shrink: 0;
  }
</style>
