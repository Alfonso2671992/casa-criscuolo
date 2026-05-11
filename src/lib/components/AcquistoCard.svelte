<script lang="ts">
  import { ACQUISTO_CATS } from '$lib/constants';
  import { showToast } from '$lib/stores';
  import { authFetch } from '$lib/firebase-client';
  import type { AcquistoItem } from '$lib/types';

  let { item }: { item: AcquistoItem } = $props();

  const cat = $derived(ACQUISTO_CATS.find(c => c.id === item.c) || ACQUISTO_CATS[5]);

  async function del() {
    const res = await authFetch(`/api/acquisto/${item._k}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!res.ok) showToast('Errore eliminazione');
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
  <button class="remove" onclick={del} aria-label="Rimuovi">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  </button>
</div>

<style>
  .card {
    display: flex; align-items: center; gap: 10px;
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
    font-size: 10px; font-weight: 800; color: var(--accent);
    background: var(--bg-secondary); padding: 3px 10px; border-radius: 20px;
    white-space: nowrap; flex-shrink: 0;
  }
  .remove {
    all: unset; width: 32px; height: 32px; border-radius: 8px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--text-muted); flex-shrink: 0;
  }
</style>
