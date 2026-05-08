<script lang="ts">
  import { toast } from '$lib/stores';
</script>

{#if $toast}
  <div class="toast"> {$toast} </div>
{/if}

<style>
  .toast {
    position: fixed;
    bottom: 20px; left: 50%; transform: translateX(-50%);
    background: var(--accent); color: var(--color-white);
    padding: 10px 20px; border-radius: 12px;
    font-size: 13px; font-weight: 700; z-index: 999;
    pointer-events: none; white-space: nowrap;
    max-width: 90vw; overflow: hidden; text-overflow: ellipsis;
  }
</style>
