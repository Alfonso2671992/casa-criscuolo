<script lang="ts">
  import { currentModal } from '$lib/stores';
</script>

<div class="header">
  <div class="title-wrap">
    <svg class="key-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg>
    <div>
      <div class="title">Casa Criscuolo</div>
      <div class="sub">/ Falabella</div>
    </div>
  </div>
  <button class="gear-btn" aria-label="Impostazioni" onclick={() => currentModal.set({ type: 'settings' })}>
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
  </button>
</div>

<style>
  .header {
    padding: env(safe-area-inset-top, 14px) 20px 12px;
    padding-top: calc(env(safe-area-inset-top, 0px) + 14px);
    background: var(--bg-card); border-bottom: 1.5px solid var(--border-light);
    flex-shrink: 0;
    display: flex; align-items: flex-start; justify-content: space-between;
  }
  .title-wrap { display: flex; align-items: center; gap: 8px; }
  .key-icon { color: var(--accent); flex-shrink: 0; }
  .title { font-size: 17px; font-weight: 700; color: var(--text-primary); font-family: 'New York', 'Iowan Old Style', Georgia, serif; line-height: 1.2; }
  .sub { font-size: 12px; font-weight: 600; color: var(--accent); font-family: 'New York', 'Iowan Old Style', Georgia, serif; font-style: italic; line-height: 1.2; }
  .gear-btn { all: unset; cursor: pointer; padding: 8px; border-radius: 10px; color: var(--text-muted); flex-shrink: 0; }
</style>
