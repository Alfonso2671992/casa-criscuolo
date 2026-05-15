<script lang="ts">
  import { toast } from '$lib/stores';

  function dismiss() { toast.set(null); }
</script>

{#if $toast}
  <div class="toast" role="button" tabindex="0" aria-live="polite" onclick={dismiss} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dismiss(); } }}>
    <span class="toast-msg">{$toast.msg}</span>
    {#if $toast.action}
      <button class="toast-action" onclick={(e) => { e.stopPropagation(); $toast!.action!.fn(); dismiss(); }}>{$toast.action.label}</button>
    {/if}
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    bottom: 20px; left: 50%; transform: translateX(-50%);
    background: var(--accent); color: var(--color-white);
    padding: 10px 16px; border-radius: 12px;
    font-size: 13px; font-weight: 700; z-index: 999; cursor: pointer;
    max-width: 90vw; overflow-wrap: break-word; word-break: break-word;
    display: flex; align-items: center; gap: 10px;
  }
  .toast-msg { flex: 1; }
  .toast-action {
    all: unset; background: rgba(255,255,255,.2); padding: 4px 10px; border-radius: 8px;
    font-size: 12px; font-weight: 800; cursor: pointer; white-space: nowrap;
  }
  .toast-action:active { background: rgba(255,255,255,.35); }
</style>
