<script lang="ts">
  import { CATS, MONTHS } from '$lib/constants';
  import { budget, saveBudget, budgetMonth, monthlyStats, showToast } from '$lib/stores';

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

  let ym = $derived($budgetMonth);
  let y = $derived(parseInt(ym.split('-')[0]));
  let m = $derived(parseInt(ym.split('-')[1]));
  let meseLabel = $derived(MONTHS[m - 1] + ' ' + y);

  function prev() {
    const d = new Date(y, m - 2, 1);
    budgetMonth.set(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
  }
  function next() {
    const d = new Date(y, m, 1);
    budgetMonth.set(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
  }

  function setBudget(id: string) {
    const v = parseFloat(editVal.replace(',', '.'));
    if (isNaN(v) || v <= 0) { showToast('Importo non valido'); return; }
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

<div class="budget-head">
  <button class="month-nav" onclick={prev} aria-label="Mese precedente">‹</button>
  <span class="budget-title">{meseLabel}</span>
  <button class="month-nav" onclick={next} aria-label="Mese successivo">›</button>
</div>
<div class="budget-body">
  {#each stats as row}
    {#if row.spent > 0 || row.budget > 0}
      <div class="row" style="--bar-color:{row.cat.color}">
        <span class="cat-icon">{@html row.cat.svg.replace('width="18" height="18"', 'width="13" height="13"')}</span>
        <span class="cat-name" style="color:{row.cat.color}">{row.cat.label}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:{row.budget > 0 ? Math.min(100, row.spent / row.budget * 100) : Math.min(100, row.spent / (stats.reduce((s, r) => s + r.spent, 0) || 1) * 100)}%"></div>
        </div>
        <button class="amt" class:over={row.budget > 0 && row.spent > row.budget} onclick={() => { editCat = row.cat.id; editVal = row.budget ? String(row.budget) : ''; }}>
          {row.spent.toFixed(0)}€{row.budget > 0 ? ' / ' + row.budget.toFixed(0) + '€' : ''}
        </button>
      </div>
    {/if}
  {/each}
  {#if stats.every(r => r.spent === 0 && r.budget === 0)}
    <div class="empty-hint">Nessuna spesa pagata. Tocca un importo per impostare un budget.</div>
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
  .budget-head { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; justify-content: center; }
  .month-nav {
    all: unset; font-size: 22px; font-weight: 800; cursor: pointer; color: var(--accent);
    padding: 8px 12px; line-height: 1; min-width: 44px; text-align: center;
  }
  .month-nav:active { opacity: .5; }
  .budget-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; color: var(--text-muted); }
  .budget-body { display: flex; flex-direction: column; gap: 5px; }
  .row { display: flex; align-items: center; gap: 5px; }
  .cat-icon { display: flex; align-items: center; flex-shrink: 0; }
  .cat-name { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .3px; width: 56px; flex-shrink: 0; }
  .bar-track { flex: 1; height: 12px; background: var(--bg-secondary); border-radius: 6px; overflow: hidden; }
  .bar-fill { height: 100%; background: var(--bar-color); border-radius: 6px; transition: width .3s; min-width: 0; }
  .amt {
    all: unset; font-size: 10px; font-weight: 800; color: var(--text-primary); cursor: pointer;
    padding: 2px 5px; border-radius: 4px; white-space: nowrap; flex-shrink: 0;
  }
  .amt:hover { background: var(--bg-secondary); }
  .amt.over { color: var(--scaduta-border); }
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
