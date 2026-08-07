<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { toast } from '$lib/stores';

  function dismiss() { toast.set(null); }
</script>

{#if $toast}
  <div
    class="toast"
    role="button"
    tabindex="0"
    aria-live="polite"
    onclick={dismiss}
    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dismiss(); } }}
    transition:fly={{ y: -24, duration: 380, easing: cubicOut }}
  >
    <span class="toast-msg">{$toast.msg}</span>
    {#if $toast.action}
      <button class="toast-action" onclick={(e) => { e.stopPropagation(); $toast!.action!.fn(); dismiss(); }}>{$toast.action.label}</button>
    {/if}
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    top: calc(env(safe-area-inset-top, 0px) + 16px); left: 50%; transform: translateX(-50%);
    background: var(--toast-bg);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    color: var(--text-primary);
    border: 1px solid var(--toast-border);
    box-shadow: 0 8px 32px var(--toast-shadow);
    padding: 11px 16px; border-radius: 14px;
    font-size: 13px; font-weight: 700; z-index: 999; cursor: pointer;
    max-width: 90vw; overflow-wrap: break-word; word-break: break-word;
    display: flex; align-items: center; gap: 10px;
  }
  .toast-msg { flex: 1; }
  .toast-action {
    all: unset; background: var(--accent); color: var(--color-white);
    padding: 4px 10px; border-radius: 8px;
    font-size: 12px; font-weight: 800; cursor: pointer; white-space: nowrap;
  }
  .toast-action:active { opacity: .8; }
</style>
