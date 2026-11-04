<script lang="ts">
  import { recurringExpenses } from '$lib/stores';
  import { fmtEuro, today } from '$lib/utils';
  import { dueReminders } from '$lib/recurring';
  import { fly } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';

  // Shown at most once a day per device: the day it last appeared
  const SEEN_KEY = 'cc_rem_seen';
  const AUTO_CLOSE_MS = 7000;
  const SLIDE = { x: '110%', opacity: 1, duration: 1100, easing: cubicInOut };

  let open = $state(false);
  let decided = false;
  const due = $derived(dueReminders($recurringExpenses, new Date()));

  function seenToday(): boolean {
    try { return localStorage.getItem(SEEN_KEY) === today(); } catch { return false; }
  }

  // Data can arrive after mount (cache first, then the realtime listener): decide once, when there is something due
  $effect(() => {
    if (decided || due.length === 0) return;
    decided = true;
    if (seenToday()) return;
    open = true;
    try { localStorage.setItem(SEEN_KEY, today()); } catch {}
  });

  $effect(() => {
    if (open) {
      const timer = setTimeout(close, AUTO_CLOSE_MS);
      return () => clearTimeout(timer);
    }
  });

  function close() {
    open = false;
  }
</script>

{#if open && due.length > 0}
  <!-- The whole box closes on tap -->
  <div class="pop" role="button" tabindex="0" aria-label="Promemoria, tocca per chiudere" onclick={close} onkeydown={(e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') close(); }} transition:fly={SLIDE}>
    <span class="label">Promemoria</span>
    <ul class="items">
      {#each due as r (r._k)}
        <li>
          <span class="name">{r.n}</span>
          <span class="meta">{fmtEuro(r.a)}&nbsp;€ · entro {r.dueLabel}</span>
        </li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  .pop {
    /* Absolute inside .app (relative, overflow hidden): sticks to the app's right edge, also on wide screens */
    position: absolute; z-index: 90; right: 0;
    /* A little below the top of the "Da pagare / Pagate" cards */
    top: calc(env(safe-area-inset-top, 0px) + 140px);
    /* As wide as its content, capped: long names are cut with "…" */
    width: max-content; max-width: min(85%, 260px); box-sizing: border-box; cursor: pointer;
    padding: 12px 14px 14px 16px; border-radius: 16px 0 0 16px;
    background: var(--bg-card); border: 1.5px solid var(--accent); border-right: none;
    box-shadow: 0 8px 24px rgba(0, 0, 0, .14);
  }
  .label { display: block; margin-bottom: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; color: var(--accent); }
  .items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
  .items li { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 15px; font-weight: 600; font-family: var(--font-serif); color: var(--text-primary); }
  .meta { font-size: 13px; font-weight: 600; color: var(--badge-urgent-color); }
</style>
