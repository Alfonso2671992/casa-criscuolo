<script lang="ts">
  import { CATS, FALLBACK_CAT } from '$lib/constants';
  import { trapFocus, scrollLock, fmtEuro } from '$lib/utils';
  import { storico, expenses } from '$lib/stores';
  import { billHistory, barLabel } from '$lib/bill-history';
  import type { Expense } from '$lib/types';

  let { expense, onClose }: { expense: Expense; onClose: () => void } = $props();

  const cat = $derived(CATS.find(c => c.id === expense.c) || FALLBACK_CAT);
  const entries = $derived(billHistory(expense.c, $storico, $expenses, expense._k));
  const bars = $derived(entries.slice(0, 6).reverse());
  const max = $derived(Math.max(...bars.map(b => b.a), 0));
  // The year goes under the bars only when they span more than one year
  const showYear = $derived(new Set(bars.map(b => b.date.slice(0, 4))).size > 1);
</script>

<div class="overlay" onclick={onClose} role="presentation" use:trapFocus use:scrollLock>
  <div class="box" onclick={(e) => e.stopPropagation()} onkeydown={(e) => { if (e.key === 'Escape') onClose(); }} role="dialog" aria-label="Storico {cat.label.toLowerCase()}" tabindex="-1">
    <div class="modal-header">
      <span class="modal-title">Storico {cat.label.toLowerCase()}</span>
      <button class="btn-x" onclick={onClose} aria-label="Chiudi">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>

    {#if bars.length > 1}
      <div class="chart" aria-hidden="true">
        {#each bars as b (b.key + b.date)}
          <div class="col">
            <div class="bar" class:cur={b.current} style="height:{max > 0 ? Math.max(4, Math.round((b.a / max) * 70)) : 4}px"></div>
            <span class="mon">{barLabel(b.date)}</span>
            {#if showYear}<span class="yr">{b.date.slice(0, 4)}</span>{/if}
          </div>
        {/each}
      </div>
    {/if}

    {#if entries.length}
      <ul class="list">
        {#each entries as e (e.key + e.date)}
          <li class="row" class:cur={e.current}>
            <span>{e.status === 'da pagare' ? 'Da pagare · ' : ''}{e.label}</span>
            <span class="amt">{fmtEuro(e.a)}&nbsp;€</span>
          </li>
        {/each}
      </ul>
    {/if}

    {#if entries.length <= 1}
      <p class="empty">Lo storico si riempirà con le prossime bollette pagate e cancellate.</p>
    {/if}
  </div>
</div>

<style>
  .overlay {
    position: fixed; inset: 0; background: var(--overlay-bg); z-index: 100;
    display: flex; align-items: flex-end; justify-content: center;
  }
  .box {
    background: var(--bg-card); border-radius: 20px 20px 0 0; width: 100%; max-width: 480px; /* same as the app column */
    padding: 20px 22px calc(24px + env(safe-area-inset-bottom)); box-sizing: border-box;
    max-height: 85vh; overflow-y: auto; animation: sheet-up .28s cubic-bezier(.2, .8, .2, 1);
  }
  @keyframes sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .modal-title { font-size: 16px; font-weight: 700; color: var(--text-primary); }
  .btn-x { all: unset; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; padding: 4px; }
  .chart { display: flex; align-items: flex-end; gap: 10px; height: 92px; margin: 8px 0 14px; }
  .col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 6px; height: 100%; }
  .bar { width: 100%; max-width: 34px; border-radius: 6px 6px 2px 2px; background: var(--border); }
  .bar.cur { background: var(--accent); }
  .mon { font-size: 11px; font-weight: 600; color: var(--text-muted); white-space: nowrap; }
  .yr { font-size: 10px; font-weight: 500; color: var(--text-muted); margin-top: -2px; }
  .list { list-style: none; margin: 0; padding: 0; }
  .row { display: flex; justify-content: space-between; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border-light); font-size: 14px; font-weight: 500; color: var(--text-primary); }
  .row:last-child { border-bottom: none; }
  .row.cur { color: var(--accent); }
  .amt { font-weight: 700; white-space: nowrap; }
  .empty { font-size: 13px; color: var(--text-muted); margin: 12px 0 0; }
</style>
