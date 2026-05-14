<script lang="ts">
  import { CATS, MONTHS } from '$lib/constants';
  import { expenses } from '$lib/stores';

  let now = $state(new Date());
  let ym = $derived(now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'));

  let paidThisMonth = $derived($expenses.filter(e => {
    if (e.s !== 'ok') return false;
    const d = e.sc ?? e.dt;
    return !!d && d.startsWith(ym);
  }));

  let totalThis = $derived(paidThisMonth.reduce((s, e) => s + e.a, 0));
  let catStats = $derived.by(() => {
    const map = new Map<string, number>();
    for (const e of paidThisMonth) {
      map.set(e.c, (map.get(e.c) || 0) + e.a);
    }
    return CATS.map(c => ({
      cat: c,
      spent: map.get(c.id) || 0,
      pct: totalThis > 0 ? ((map.get(c.id) || 0) / totalThis * 100) : 0,
    })).filter(r => r.spent > 0).sort((a, b) => b.spent - a.spent);
  });

  let prevDate = $derived(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  let prevYm = $derived(prevDate.getFullYear() + '-' + String(prevDate.getMonth() + 1).padStart(2, '0'));
  let totalPrev = $derived($expenses.filter(e => {
    if (e.s !== 'ok') return false;
    const d = e.sc ?? e.dt;
    return !!d && d.startsWith(prevYm);
  }).reduce((s, e) => s + e.a, 0));

  let diffPct = $derived(totalPrev > 0 ? ((totalThis - totalPrev) / totalPrev * 100) : 0);

  let meseLabel = $derived(MONTHS[now.getMonth()] + ' ' + now.getFullYear());

  function prevMonth() { now = new Date(now.getFullYear(), now.getMonth() - 1, 1); }
  function nextMonth() { now = new Date(now.getFullYear(), now.getMonth() + 1, 1); }
</script>

<div class="stats-head">
  <button class="month-nav" onclick={prevMonth} aria-label="Mese precedente">‹</button>
  <span class="stats-title">{meseLabel}</span>
  <button class="month-nav" onclick={nextMonth} aria-label="Mese successivo">›</button>
</div>

<div class="stats-total">
  <span class="total-label">Totale pagato</span>
  <span class="total-amount">€{totalThis.toFixed(0)}</span>
  {#if totalPrev > 0}
    <span class="total-diff" class:up={diffPct > 0} class:down={diffPct < 0}>
      {diffPct > 0 ? '↑' : '↓'} {Math.abs(diffPct).toFixed(0)}%
    </span>
  {/if}
</div>

{#if catStats.length > 0}
  <div class="cat-list">
    {#each catStats as row}
      <div class="cat-row">
        <div class="cat-info">
          <span class="cat-icon">{@html row.cat.svg.replace('width="18" height="18"', 'width="12" height="12"')}</span>
          <span class="cat-label" style="color:{row.cat.color}">{row.cat.label}</span>
        </div>
        <div class="cat-bar-track">
          <div class="cat-bar-fill" style="width:{row.pct}%;background:{row.cat.color}"></div>
        </div>
        <span class="cat-amt">€{row.spent.toFixed(0)}</span>
        <span class="cat-pct">{row.pct.toFixed(0)}%</span>
      </div>
    {/each}
  </div>
{:else}
  <div class="empty">Nessuna spesa pagata in questo mese</div>
{/if}

<style>
  .stats-head { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; justify-content: center; }
  .month-nav {
    all: unset; font-size: 22px; font-weight: 800; cursor: pointer; color: var(--accent);
    padding: 8px 12px; line-height: 1; min-width: 44px; text-align: center;
  }
  .month-nav:active { opacity: .5; }
  .stats-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; color: var(--text-muted); }
  .stats-total { display: flex; align-items: baseline; gap: 8px; justify-content: center; margin-bottom: 10px; }
  .total-label { font-size: 11px; color: var(--text-muted); font-weight: 600; }
  .total-amount { font-size: 22px; font-weight: 900; color: var(--text-primary); }
  .total-diff { font-size: 12px; font-weight: 800; padding: 2px 8px; border-radius: 6px; }
  .total-diff.up { color: var(--scaduta-border); background: var(--scaduta-bg); }
  .total-diff.down { color: var(--color-green-dark); background: var(--bought-card-bg); }
  .cat-list { display: flex; flex-direction: column; gap: 6px; }
  .cat-row { display: flex; align-items: center; gap: 6px; }
  .cat-info { display: flex; align-items: center; gap: 4px; width: 80px; flex-shrink: 0; }
  .cat-icon { display: flex; align-items: center; flex-shrink: 0; }
  .cat-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cat-bar-track { flex: 1; height: 10px; background: var(--bg-secondary); border-radius: 5px; overflow: hidden; }
  .cat-bar-fill { height: 100%; border-radius: 5px; transition: width .3s; min-width: 0; }
  .cat-amt { font-size: 10px; font-weight: 800; color: var(--text-primary); width: 40px; text-align: right; flex-shrink: 0; }
  .cat-pct { font-size: 9px; font-weight: 700; color: var(--text-muted); width: 30px; text-align: right; flex-shrink: 0; }
  .empty { font-size: 11px; color: var(--text-muted); text-align: center; padding: 8px 0; }
</style>
