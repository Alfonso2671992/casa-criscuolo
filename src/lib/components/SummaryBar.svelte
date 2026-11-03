<script lang="ts">
  import { totalUnpaid, totalPaid, reminderQueue } from '$lib/stores';
  import { fmtEuro } from '$lib/utils';
  import { fade, fly } from 'svelte/transition';

  const REMINDER_MS = 8000;

  $effect(() => {
    if ($reminderQueue.length > 0) {
      const timer = setTimeout(dismiss, REMINDER_MS);
      return () => clearTimeout(timer);
    }
  });

  function dismiss() {
    reminderQueue.set([]);
  }
</script>

<div class="wrap">
  {#if $reminderQueue.length > 0}
    <button class="reminder" onclick={dismiss} aria-label="Chiudi promemoria" in:fly={{ y: -6, duration: 250 }} out:fade={{ duration: 150 }}>
      <span class="rem-label">Promemoria</span>
      {#each $reminderQueue as r (r._k)}
        <span class="rem-row">
          <span class="rem-name">{r.n}</span>
          <span class="rem-meta"><span class="rem-amt">{fmtEuro(r.a)}&nbsp;€</span> · entro {r.dueLabel}</span>
        </span>
      {/each}
    </button>
  {:else}
    <div class="grid" transition:fade={{ duration: 200 }}>
      <div class="card da">
        <div class="label">Da pagare</div>
        <div class="val">{fmtEuro($totalUnpaid)}&nbsp;€</div>
      </div>
      <div class="card ok">
        <div class="label">Pagate</div>
        <div class="val">{fmtEuro($totalPaid)}&nbsp;€</div>
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

  /* In normal flow, so the box grows with the number of reminders */
  .reminder {
    all: unset; box-sizing: border-box; width: 100%; min-height: 70px; cursor: pointer;
    border-radius: 14px; padding: 12px 16px;
    background: var(--badge-urgent-bg); border: 1.5px solid var(--accent);
    display: flex; flex-direction: column; justify-content: center; gap: 4px;
  }
  .rem-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; color: var(--accent); }
  .rem-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
  .rem-name {
    font-size: 17px; font-weight: 600; font-family: var(--font-serif); color: var(--text-primary);
    min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .rem-meta { font-size: 13px; font-weight: 500; color: var(--text-primary); white-space: nowrap; }
  .rem-amt { font-weight: 700; }
</style>
