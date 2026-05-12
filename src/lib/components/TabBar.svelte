<script lang="ts">
  import { currentTab } from '$lib/stores';
  import type { TabId } from '$lib/types';

  const tabs: { id: TabId; label: string; svg: string }[] = [
    { id: 'spese', label: 'Spese', svg: '' },
    { id: 'acquisto', label: 'Da acquistare', svg: '' },
    { id: 'casa', label: 'Casa', svg: '' },
    { id: 'misure', label: 'Misure', svg: '' },
    { id: 'carte', label: 'Carte', svg: '' },
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
    </button>
  {/each}
</div>

<style>
  .tabs {
    display: flex; background: var(--bg-secondary); border-bottom: 1.5px solid var(--border);
    padding: 0 4px; flex-shrink: 0;
  }
  .tab {
    all: unset; flex: 1; padding: 10px 0 9px; text-align: center;
    font-size: 10px; font-weight: 700; color: var(--text-secondary); cursor: pointer;
    border-radius: 10px 10px 0 0; margin: 4px 2px 0;
  }
  .tab.active { color: var(--color-white); background: var(--accent); }
</style>
