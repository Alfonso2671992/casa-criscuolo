<script lang="ts">
  import { MONTHS, DAYS } from '$lib/constants';
  import { pad } from '$lib/utils';

  let { selected = $bindable<string | null>(null), buttonLabel = $bindable('Scegli data') }: {
    selected?: string | null; buttonLabel?: string;
  } = $props();

  let open = $state(false);
  let nav = $state(new Date());
  let sel = $state(selected ? new Date(selected + 'T12:00:00') : null);

  $effect(() => { selected = sel ? dateStr(sel) : null; });

  function dateStr(d: Date) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function display(s: string | null) {
    if (!s) return buttonLabel;
    const p = s.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }
  function isToday(d: Date) { return dateStr(d) === dateStr(new Date()); }

  function navMonth(dir: number) {
    nav = new Date(nav.getFullYear(), nav.getMonth() + dir, 1);
  }

  function selectDay(d: number) {
    sel = new Date(nav.getFullYear(), nav.getMonth(), d, 12);
    open = false;
  }


  function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
  function startOffset(y: number, m: number) { return (new Date(y, m, 1).getDay() + 6) % 7; }

  const navData = $derived.by(() => {
    const y = nav.getFullYear(), m = nav.getMonth();
    return { days: daysInMonth(y, m), off: startOffset(y, m) };
  });
</script>

<div class="wrap">
  <button class="date-btn" onclick={(e) => { e.stopPropagation(); open = !open; }}>
    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    <span>{display(selected)}</span>
  </button>

  {#if open}
    <div class="dropdown" onclick={(e) => e.stopPropagation()} role="presentation">
      <div class="cal-header">
        <button class="nav" onclick={() => navMonth(-1)} aria-label="Mese precedente">‹</button>
        <span class="cal-title">{MONTHS[nav.getMonth()]} {nav.getFullYear()}</span>
        <button class="nav" onclick={() => navMonth(1)} aria-label="Mese successivo">›</button>
      </div>
      <div class="cal-grid">
        {#each DAYS as d}<div class="day-name">{d}</div>{/each}
        {#each { length: navData.off }}<div></div>{/each}
        {#each { length: navData.days } as _, i}
          {@const day = i + 1}
          {@const ds = dateStr(new Date(nav.getFullYear(), nav.getMonth(), day))}
          <button
            class="day"
            class:selected={sel && dateStr(sel) === ds}
            class:today={isToday(new Date(nav.getFullYear(), nav.getMonth(), day))}
            onclick={() => selectDay(day)}
          >{day}</button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<svelte:window onclick={(e) => { if (!(e.target as HTMLElement)?.closest?.('.wrap')) open = false; }} onkeydown={(e) => { if (e.key === 'Escape') open = false; }} />

<style>
  .wrap { position: relative; }
  .date-btn {
    all: unset; display: flex; align-items: center; gap: 6px;
    padding: 10px 11px; border-radius: 10px; border: 1.5px solid var(--border);
    background: var(--bg-app); cursor: pointer; box-sizing: border-box; width: 100%;
  }
  .date-btn span { font-size: 11px; font-weight: 600; color: var(--text-primary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dropdown {
    position: absolute; top: 100%; left: 0; right: 0; z-index: 50;
    background: var(--bg-app); border: 1.5px solid var(--border); border-radius: 14px;
    padding: 12px; margin-top: 4px;
  }
  .cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .cal-title { font-size: 12px; font-weight: 700; color: var(--text-primary); }
  .nav { all: unset; width: 28px; height: 28px; border-radius: 8px; background: var(--accent); color: var(--color-white); font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 700; }
  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
  .day-name { text-align: center; font-size: 10px; font-weight: 700; color: var(--text-muted); padding: 2px 0; }
  .day { all: unset; text-align: center; padding: 5px 2px; border-radius: 7px; font-size: 12px; cursor: pointer; color: var(--text-primary); display: block; width: 100%; }
  .day.today { background: var(--cal-today-bg); color: var(--accent); font-weight: 700; }
  .day.selected { background: var(--accent); color: var(--color-white); font-weight: 700; }
</style>
