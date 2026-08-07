<script lang="ts">
  import { totalUnpaid, totalPaid, reminderQueue } from '$lib/stores';
  import { fmtEuro } from '$lib/utils';
  import { fade, fly } from 'svelte/transition';

  $effect(() => {
    if ($reminderQueue.length > 0) {
      const timer = setTimeout(() => {
        reminderQueue.update(q => q.slice(1));
      }, 4000);
      return () => clearTimeout(timer);
    }
  });

  const current = $derived($reminderQueue[0] ?? null);
</script>

<div class="wrap">
  {#if current}
    {#key current._k}
      <div class="reminder" in:fly={{ y: -6, duration: 250 }} out:fade={{ duration: 150 }}>
        <div class="rem-label">Promemoria</div>
        <div class="rem-name">{current.n}</div>
        <div class="rem-meta">€{fmtEuro(current.a)} · dal {current.from} al {current.to} del mese</div>
      </div>
    {/key}
  {:else}
    <div class="grid" transition:fade={{ duration: 200 }}>
      <div class="card da">
        <div class="label">Da pagare</div>
        <div class="val">€ {fmtEuro($totalUnpaid)}</div>
      </div>
      <div class="card ok">
        <div class="label">Pagate</div>
        <div class="val">€ {fmtEuro($totalPaid)}</div>
      </div>
    </div>
  {/if}
</div>

<style>
  .wrap { position: relative; min-height: 70px; margin-bottom: 14px; }
  .grid { position: absolute; inset: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .card { border-radius: 14px; padding: 12px 14px; }
  .da { background: var(--warning-bg); border: 1.5px solid var(--warning-border); }
  .ok { background: var(--paid-bg); border: 1.5px solid var(--paid-border); }
  .label { font-size: 10px; font-weight: 800; margin-bottom: 2px; text-transform: uppercase; letter-spacing: .5px; }
  .da .label { color: var(--color-brown); }
  .ok .label { color: var(--color-green-dark); }
  .val { font-size: 24px; font-weight: 600; font-family: var(--font-serif); }
  .da .val { color: var(--color-brown); }
  .ok .val { color: var(--color-green-dark); }

  .reminder {
    position: absolute; inset: 0;
    border-radius: 14px; padding: 12px 16px;
    background: var(--badge-urgent-bg); border: 1.5px solid var(--accent);
    display: flex; flex-direction: column; gap: 2px;
  }
  .rem-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; color: var(--accent); }
  .rem-name { font-size: 20px; font-weight: 600; font-family: var(--font-serif); color: var(--text-primary); }
  .rem-meta { font-size: 12px; font-weight: 500; color: var(--text-muted); }
</style>
