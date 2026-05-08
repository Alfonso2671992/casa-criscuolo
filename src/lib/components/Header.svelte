<script lang="ts">
  let showSettings = $state(false);
  import SettingsModal from './SettingsModal.svelte';
</script>

<div class="header">
  <div>
    <div class="title">Casa Criscuolo</div>
    <div class="subtitle">/ Falabella</div>
  </div>
  <button class="gear-btn" aria-label="Impostazioni" onclick={() => showSettings = true}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
  </button>
</div>

{#if showSettings}
  <SettingsModal onClose={() => showSettings = false} />
{/if}

<style>
  .header {
    padding: env(safe-area-inset-top, 14px) 20px 12px;
    padding-top: calc(env(safe-area-inset-top, 0px) + 14px);
    background: var(--bg-card); border-bottom: 1.5px solid var(--border-light);
    flex-shrink: 0;
    display: flex; align-items: flex-start; justify-content: space-between;
  }
  .title { font-size: 17px; font-weight: 700; color: var(--text-primary); font-family: Georgia, serif; line-height: 1.2; }
  .subtitle { font-size: 12px; font-weight: 600; color: var(--accent); font-family: Georgia, serif; font-style: italic; line-height: 1.2; }
  .gear-btn { all: unset; cursor: pointer; padding: 4px; border-radius: 8px; color: var(--text-muted); flex-shrink: 0; margin-top: 2px; }
</style>
