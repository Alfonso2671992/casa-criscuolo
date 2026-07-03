<script lang="ts">
  import { currentTab, urgentCount } from '$lib/stores';
  import type { TabId } from '$lib/types';

  const tabs: { id: TabId; label: string; svg: string }[] = [
    { id: 'spese', label: 'Spese', svg: '' },
    { id: 'acquisto', label: 'Da acquistare', svg: '' },
    { id: 'casa', label: 'Casa', svg: '' },
    { id: 'misure', label: 'Misure', svg: '' },
  ];
</script>

<div class="tabs">
  {#each tabs as { id, label, svg }}
    <button
      class="tab"
      class:active={$currentTab === id}
      onclick={() => currentTab.set(id)}
    >
      {#if svg}{@html svg}<span style="margin-left:4px">{label}</span>{:else}{label}{/if}
      {#if id === 'spese' && $urgentCount > 0}
        <span class="badge">{$urgentCount > 9 ? '9+' : $urgentCount}</span>
      {/if}
    </button>
  {/each}
</div>

<style>
  .tabs {
    display: flex; background: var(--bg-secondary); border-bottom: 1.5px solid var(--border);
    padding: 0 4px; flex-shrink: 0;
  }
  .tab {
    all: unset; flex: 1; padding: 14px 0 12px; text-align: center;
    font-size: 12px; font-weight: 700; color: var(--text-secondary); cursor: pointer;
    border-radius: 10px 10px 0 0; margin: 4px 2px 0;
  }
  .tab.active { color: var(--color-white); background: var(--accent); }
  .badge {
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--scaduta-border); color: var(--color-white);
    font-size: 9px; font-weight: 800; min-width: 15px; height: 15px;
    border-radius: 8px; padding: 0 3px; margin-left: 3px; vertical-align: middle; line-height: 1;
  }
  .tab.active .badge { background: rgba(255,255,255,0.9); color: var(--accent); }
</style>
