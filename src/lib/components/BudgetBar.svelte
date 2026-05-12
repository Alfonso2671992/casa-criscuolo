<script lang="ts">
  import { CATS, MONTHS } from '$lib/constants';
  import { budget, saveBudget, monthlyStats, showToast } from '$lib/stores';

  let collapsed = $state(true);
  let editCat = $state<string | null>(null);
  let editVal = $state('');

  let stats = $derived.by(() => {
    const m = $monthlyStats;
    return CATS.map(c => ({
      cat: c,
      spent: m.get(c.id) || 0,
      budget: ($budget)[c.id] || 0,
    }));
  });

  let totalSpent = $derived(stats.reduce((s, r) => s + r.spent, 0));
  let totalBudget = $derived(stats.reduce((s, r) => s + r.budget, 0));

  const now = new Date();
  const meseLabel = MONTHS[now.getMonth()] + ' ' + now.getFullYear();

  function setBudget(id: string) {
    const v = parseFloat(editVal.replace(',', '.'));
    if (isNaN(v)) { showToast('Importo non valido'); return; }
    saveBudget({ ...$budget, [id]: v });
    editCat = null;
    showToast('Budget aggiornato');
  }

  function resetBudget(id: string) {
    const b = { ...$budget };
    delete b[id];
    saveBudget(b);
    editCat = null;
    showToast('Budget rimosso');
  }
</script>

<div class="budget-wrap">
  <div class="budget-header" class:collapsed onclick={() => collapsed = !collapsed} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); collapsed = !collapsed; } }} role="button" tabindex="0">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
    <span class="budget-title">Budget {meseLabel}</span>
    <span class="budget-total">{totalSpent.toFixed(0)}€{totalBudget > 0 ? ' / ' + totalBudget.toFixed(0) + '€' : ''}</span>
    <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
  </div>
  {#if !collapsed}
    <div class="budget-body">
      {#each stats as row}
        {#if row.spent > 0 || row.budget > 0}
          <div class="row" style="--bar-color:{row.cat.color}">
            <span class="cat-label">{row.cat.label}</span>
            <div class="bar-track">
              <div class="bar-fill" style="width:{row.budget > 0 ? Math.min(100, row.spent / row.budget * 100) : Math.min(100, row.spent / (totalSpent || 1) * 100)}%"></div>
            </div>
            <button class="amt" class:over={row.budget > 0 && row.spent > row.budget} onclick={() => { editCat = row.cat.id; editVal = row.budget ? String(row.budget) : ''; }}>
              {row.spent.toFixed(0)}€{row.budget > 0 ? ' / ' + row.budget.toFixed(0) + '€' : ''}
            </button>
          </div>
        {/if}
      {/each}
      {#if stats.every(r => r.spent === 0 && r.budget === 0)}
        <div class="empty-hint">Nessuna spesa questo mese. Tocca un importo per impostare un budget.</div>
      {/if}
    </div>
  {/if}
</div>

{#if editCat}
  <div class="overlay" onclick={() => editCat = null} role="presentation">
    <div class="modal" onclick={(e) => e.stopPropagation()} onkeydown={(e) => { if (e.key === 'Escape') editCat = null; }} role="dialog" tabindex="-1">
      <div class="modal-title">Budget {CATS.find(c => c.id === editCat)?.label}</div>
      <input class="inp" type="text" inputmode="decimal" placeholder="Budget mensile (€)" bind:value={editVal} />
      <button class="btn-primary" onclick={() => setBudget(editCat!)}>Salva</button>
      <button class="btn-cancel" onclick={() => resetBudget(editCat!)}>Rimuovi budget</button>
      <button class="btn-cancel" onclick={() => editCat = null}>Annulla</button>
    </div>
  </div>
{/if}

<style>
  .budget-wrap { background: var(--bg-card); border-radius: 16px; border: 1.5px solid var(--border); margin-bottom: 10px; overflow: hidden; }
  .budget-header {
    display: flex; align-items: center; gap: 6px; padding: 11px 14px;
    cursor: pointer; user-select: none; color: var(--accent);
  }
  .budget-header.collapsed { margin-bottom: 0; }
  .budget-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; }
  .budget-total { margin-left: auto; font-size: 12px; font-weight: 700; color: var(--text-primary); }
  .budget-body { padding: 0 14px 10px; display: flex; flex-direction: column; gap: 6px; }
  .row { display: flex; align-items: center; gap: 6px; }
  .cat-label { font-size: 9px; font-weight: 700; color: var(--text-muted); width: 52px; flex-shrink: 0; text-transform: uppercase; letter-spacing: .3px; }
  .bar-track { flex: 1; height: 14px; background: var(--bg-secondary); border-radius: 7px; overflow: hidden; }
  .bar-fill { height: 100%; background: var(--bar-color); border-radius: 7px; transition: width .3s; min-width: 0; }
  .amt {
    all: unset; font-size: 11px; font-weight: 800; color: var(--text-primary); cursor: pointer;
    padding: 2px 6px; border-radius: 5px; white-space: nowrap; flex-shrink: 0;
  }
  .amt:hover { background: var(--bg-secondary); }
  .amt.over { color: var(--scaduta-border); }
  .chevron { transition: transform .2s; flex-shrink: 0; }
  .collapsed .chevron { transform: rotate(-90deg); }
  .empty-hint { font-size: 11px; color: var(--text-muted); text-align: center; padding: 8px 0; }
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: 100;
    display: flex; align-items: center; justify-content: center;
  }
  .modal { background: var(--bg-card); border-radius: 18px; padding: 22px; width: 280px; max-width: 90vw; }
  .modal-title { font-size: 15px; font-weight: 800; color: var(--text-primary); margin-bottom: 12px; text-align: center; }
  .inp {
    all: unset; display: block; width: 100%; padding: 10px 12px; border-radius: 10px;
    border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text-primary);
    font-size: 14px; font-weight: 500; margin-bottom: 10px; box-sizing: border-box;
  }
  .btn-primary {
    all: unset; display: block; width: 100%; padding: 12px; border-radius: 10px;
    background: var(--accent); color: var(--color-white); font-size: 14px; font-weight: 700;
    text-align: center; cursor: pointer; box-sizing: border-box; margin-bottom: 6px;
  }
  .btn-cancel {
    all: unset; display: block; width: 100%; padding: 10px; border-radius: 10px;
    background: transparent; color: var(--text-muted); font-size: 13px; font-weight: 700;
    text-align: center; cursor: pointer; box-sizing: border-box;
  }
</style>
