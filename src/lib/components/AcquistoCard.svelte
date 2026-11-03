<script lang="ts">
  import { ACQUISTO_CATS, FALLBACK_ACQ } from '$lib/constants';
  import { showToast, currentModal } from '$lib/stores';
  import { authFetch } from '$lib/firebase-client';
  import type { AcquistoItem } from '$lib/types';
  import { cap } from '$lib/utils';

  let { item }: { item: AcquistoItem } = $props();

  const cat = $derived(ACQUISTO_CATS.find(c => c.id === item.c) || FALLBACK_ACQ);

  async function del() {
    const res = await authFetch(`/api/acquisto/${item._k}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!res.ok) showToast('Errore eliminazione');
    currentModal.set(null);
  }

  async function toggleUrgent() {
    currentModal.set(null);
    try {
      const res = await authFetch(`/api/acquisto/${item._k}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ u: !item.u }),
      });
      if (!res.ok) showToast('Errore salvataggio');
    } catch {
      showToast('Errore di rete, riprova');
    }
  }

  function askToggleUrgent() {
    const name = cap(item.n);
    currentModal.set({
      type: 'confirm',
      message: item.u ? `Togliere l'urgenza a "${name}"?` : `Rendere "${name}" urgente?`,
      onConfirm: toggleUrgent,
      onCancel: () => currentModal.set(null),
    });
  }
</script>

<div class="card" class:urgent={item.u}>
  <button class="main" onclick={askToggleUrgent} aria-pressed={!!item.u} aria-label={item.u ? `${cap(item.n)}, urgente: tocca per togliere l'urgenza` : `${cap(item.n)}: tocca per renderlo urgente`}>
    <span class="cat-icon" style="background:{cat.bg};color:{cat.color}">{@html cat.svg.replace('width="18" height="18"', 'width="20" height="20"')}</span>
    <span class="center">
      <span class="name">{cap(item.n)}</span>
      {#if item.u}<span class="urgent-badge">· Urgente</span>{/if}
    </span>
  </button>
  <button class="remove" onclick={() => currentModal.set({ type: 'confirm', message: 'Rimuovere "' + item.n + '"?', onConfirm: del, onCancel: () => currentModal.set(null) })} aria-label="Rimuovi">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
  </button>
</div>

<style>
  .card {
    display: flex; align-items: center; gap: 14px;
    padding: 10px 12px; border-radius: 14px;
    background: var(--bg-card); border: 1.5px solid var(--border-light);
    margin-bottom: 6px;
  }
  /* Icon and name are one tap target that toggles the urgency */
  .main {
    all: unset; flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px;
    cursor: pointer; -webkit-tap-highlight-color: transparent;
  }
  .cat-icon {
    flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
  }
  .center { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 5px; }
  .name {
    font-size: 14px; font-weight: 600; font-family: var(--font-serif); color: var(--text-primary);
    min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .card.urgent { background: var(--badge-urgent-bg); border-color: var(--accent); }
  .urgent-badge { flex-shrink: 0; font-size: 14px; font-weight: 600; color: var(--badge-urgent-color); white-space: nowrap; }
  .remove {
    all: unset; width: 36px; height: 36px; border-radius: 9px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg-secondary); color: var(--color-brown); flex-shrink: 0;
  }
</style>
