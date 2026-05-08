<script lang="ts">
  import { esc } from '$lib/utils';
  import { showToast } from '$lib/stores';
  import { authFetch } from '$lib/firebase-client';
  import type { Misura } from '$lib/types';

  let { misura }: { misura: Misura } = $props();

  async function del() {
    const res = await authFetch(`/api/mis/${misura._k}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!res.ok) showToast('Errore eliminazione');
  }
</script>

<div class="card">
  {#if misura.p}
    <img src={misura.p} class="photo" alt={misura.n} />
  {:else}
    <div class="ph">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A07850" stroke-width="1.5"><path d="M3 6h18M3 12h12M3 18h8"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>
    </div>
  {/if}
  <div class="body">
    <div class="top">
      <span class="name">{esc(misura.n)}</span>
      <button class="btn-del" onclick={del}>✕</button>
    </div>
    {#if misura.d}
      <div class="badge">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C4622D" stroke-width="2.5"><path d="M4 20h16M4 4v16"/><path d="M8 16V8M12 16v-4M16 16V6"/></svg>
        <span>{esc(misura.d)}</span>
      </div>
    {/if}
    {#if misura.note}<div class="note">{esc(misura.note)}</div>{/if}
  </div>
</div>

<style>
  .card { background: #FDF6EC; border-radius: 16px; overflow: hidden; border: 1.5px solid #EDD9C0; margin-bottom: 10px; }
  .photo { width: 100%; height: 110px; object-fit: cover; display: block; }
  .ph { width: 100%; height: 52px; background: #EDD9C0; display: flex; align-items: center; justify-content: center; }
  .body { padding: 10px 13px 12px; }
  .top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 5px; }
  .name { font-size: 14px; font-weight: 700; color: #3D2010; font-family: Georgia, serif; }
  .btn-del { all: unset; background: #EDD9C0; border-radius: 7px; padding: 4px 9px; font-size: 11px; color: #8B4513; cursor: pointer; font-weight: 700; display: inline-block; flex-shrink: 0; }
  .badge { display: inline-flex; align-items: center; gap: 6px; background: #EDD9C0; border: 1.5px solid #D4A574; border-radius: 9px; padding: 5px 12px; margin-bottom: 5px; }
  .badge span { font-size: 13px; font-weight: 800; color: #C4622D; }
  .note { font-size: 12px; color: #8B6040; font-weight: 500; }
</style>
