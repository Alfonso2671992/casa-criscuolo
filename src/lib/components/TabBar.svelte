<script lang="ts">
  import { currentTab } from '$lib/stores';
  import type { TabId } from '$lib/types';

  const tabs: { id: TabId; label: string }[] = [
    { id: 'spese', label: 'Spese' },
    { id: 'acquisto', label: 'Da acquistare' },
    { id: 'casa', label: 'Casa' },
    { id: 'misure', label: 'Misure' },
  ];
</script>

<div class="tabs">
  {#each tabs as { id, label }}
    <button
      class="tab"
      class:active={$currentTab === id}
      onclick={() => currentTab.set(id)}
    >{label}</button>
  {/each}
</div>

<style>
  .tabs {
    display: flex; background: #EDD9C0; border-bottom: 1.5px solid #D4A574;
    padding: 0 4px; flex-shrink: 0;
  }
  .tab {
    all: unset; flex: 1; padding: 10px 0 9px; text-align: center;
    font-size: 10px; font-weight: 700; color: #8B6040; cursor: pointer;
    border-radius: 10px 10px 0 0; margin: 4px 2px 0;
  }
  .tab.active { color: #FFF; background: #C4622D; }
</style>
