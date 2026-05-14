<script lang="ts">
  import { CATS, MONTHS } from '$lib/constants';
  import { expenses } from '$lib/stores';

  let now = $state(new Date());
  let ym = $derived(now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'));
  let prevYm = $derived.by(() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  });

  function monthSpent(ymStr: string) {
    const map = new Map<string, number>();
    for (const e of $expenses) {
      if (e.s !== 'ok') continue;
      const d = e.sc ?? e.dt;
      if (!d || !d.startsWith(ymStr)) continue;
      map.set(e.c, (map.get(e.c) || 0) + e.a);
    }
    return map;
  }

  let thisMap = $derived(monthSpent(ym));
  let prevMap = $derived(monthSpent(prevYm));
  let totalThis = $derived(Array.from(thisMap.values()).reduce((s, v) => s + v, 0));
  let maxCat = $derived(Math.max(...Array.from(thisMap.values()), 1));

  let catStats = $derived.by(() => {
    return CATS.map(c => {
      const spent = thisMap.get(c.id) || 0;
      const prev = prevMap.get(c.id) || 0;
      const diffEuro = spent - prev;
      const pct = totalThis > 0 ? ((spent) / totalThis * 100) : 0;
      return { cat: c, spent, prev, diffEuro, pct, barH: maxCat > 0 ? (spent / maxCat * 100) : 0 };
    }).filter(r => r.spent > 0).sort((a, b) => b.spent - a.spent);
  });

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
</div>

{#if catStats.length > 0}
  <div class="bar-chart">
    {#each catStats as row}
      <div class="bar-cell">
        <span class="bar-amt">€{row.spent.toFixed(0)}</span>
        <div class="bar-track">
          <div class="bar" style="height:{row.barH}%;background:{row.cat.color}"></div>
        </div>
        <span class="bar-icon">{@html row.cat.svg.replace('width="18" height="18"', 'width="14" height="14"')}</span>
        <span class="bar-label">{row.cat.label}</span>
        {#if row.prev > 0 && row.diffEuro !== 0}
          <span class="bar-diff" class:up={row.diffEuro > 0} class:down={row.diffEuro < 0}>
            {row.diffEuro > 0 ? '↑' : '↓'}€{Math.abs(row.diffEuro).toFixed(0)}
          </span>
        {/if}
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
  .stats-total { display: flex; align-items: baseline; gap: 8px; justify-content: center; margin-bottom: 12px; }
  .total-label { font-size: 11px; color: var(--text-muted); font-weight: 600; }
  .total-amount { font-size: 22px; font-weight: 900; color: var(--text-primary); }
  .bar-chart { display: flex; gap: 10px; overflow-x: auto; padding: 4px 4px 0; }
  .bar-cell { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 52px; flex-shrink: 0; }
  .bar-amt { font-size: 10px; font-weight: 800; color: var(--text-primary); }
  .bar-track { width: 24px; height: 60px; position: relative; background: var(--bg-secondary); border-radius: 5px; overflow: hidden; }
  .bar { width: 24px; position: absolute; bottom: 0; border-radius: 5px 5px 0 0; }
  .bar-icon { display: flex; align-items: center; color: var(--text-muted); }
  .bar-label { font-size: 10px; font-weight: 700; color: var(--text-muted); text-align: center; text-transform: uppercase; letter-spacing: .3px; white-space: nowrap; }
  .bar-diff { font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 4px; }
  .bar-diff.up { color: var(--scaduta-border); background: var(--scaduta-bg); }
  .bar-diff.down { color: var(--color-green-dark); background: var(--bought-card-bg); }
  .empty { font-size: 11px; color: var(--text-muted); text-align: center; padding: 8px 0; }
</style>
