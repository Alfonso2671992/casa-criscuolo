<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { currentTab, expenses, wishes, misure, acquisti, cacheExpenses, cacheWishes, cacheMisure, cacheAcquisti, showToast } from '$lib/stores';
  import { listenExpenses, listenWishes, listenMisure, listenAcquisti, authFetch } from '$lib/firebase-client';
  import { ACQUISTO_CATS } from '$lib/constants';
  import SummaryBar from '$lib/components/SummaryBar.svelte';
  import ExpenseForm from '$lib/components/ExpenseForm.svelte';
  import ExpenseCard from '$lib/components/ExpenseCard.svelte';
  import WishForm from '$lib/components/WishForm.svelte';
  import WishCard from '$lib/components/WishCard.svelte';
  import MisuraForm from '$lib/components/MisuraForm.svelte';
  import MisuraCard from '$lib/components/MisuraCard.svelte';
  import AcquistoForm from '$lib/components/AcquistoForm.svelte';
  import AcquistoCard from '$lib/components/AcquistoCard.svelte';

  let unsubExp = $state<() => void>(() => {});
  let unsubWish = $state<() => void>(() => {});
  let unsubMis = $state<() => void>(() => {});
  let unsubAcq = $state<() => void>(() => {});

  let searchQuery = $state('');
  let hideBought = $state(false);
  let collapsed = $state(new Set<string>());

  function toggleCat(id: string) {
    const next = new Set(collapsed);
    if (next.has(id)) next.delete(id); else next.add(id);
    collapsed = next;
  }

  let filtered = $derived.by(() => {
    const q = searchQuery.toLowerCase().trim();
    const map = new Map<string, typeof $acquisti>();
    for (const item of $acquisti) {
      if (hideBought && item.b) continue;
      if (q && !item.n.toLowerCase().includes(q)) continue;
      const list = map.get(item.c);
      if (list) list.push(item); else map.set(item.c, [item]);
    }
    return ACQUISTO_CATS.map(c => ({ cat: c, items: (map.get(c.id) || []).sort((a, b) => a.ts - b.ts) })).filter(g => g.items.length > 0);
  });

  async function svuotaCat(cat: string) {
    const res = await authFetch('/api/acquisto', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ c: cat }),
    });
    if (!res.ok) { const d = await res.json(); showToast(d?.error || 'Errore'); return; }
    showToast('Categoria svuotata');
  }

  onMount(() => {
    unsubExp = listenExpenses((data) => cacheExpenses(data));
    unsubWish = listenWishes((data) => cacheWishes(data));
    unsubMis = listenMisure((data) => cacheMisure(data));
    unsubAcq = listenAcquisti((data) => cacheAcquisti(data));
  });

  onDestroy(() => {
    unsubExp();
    unsubWish();
    unsubMis();
    unsubAcq();
  });
</script>

<!-- SPESE -->
<div class="section" class:active={$currentTab === 'spese'}>
  <SummaryBar />
  <ExpenseForm />
  <div class="divider">
    <div class="divider-line"></div>
    <span class="divider-label" style="color:var(--accent)">Da pagare</span>
    <div class="divider-line"></div>
  </div>
  {#each $expenses.filter(e => e.s === 'da') as exp (exp._k)}
    <ExpenseCard expense={exp} isDa={true} />
  {:else}
    <div class="empty">Nessuna spesa da pagare</div>
  {/each}
  <div class="divider" style="margin-top:8px">
    <div class="divider-line"></div>
    <span class="divider-label" style="color:var(--color-green)">Pagate</span>
    <div class="divider-line"></div>
  </div>
  {#each $expenses.filter(e => e.s === 'ok') as exp (exp._k)}
    <ExpenseCard expense={exp} isDa={false} />
  {:else}
    <div class="empty">Nessuna spesa pagata</div>
  {/each}
</div>

<!-- DA ACQUISTARE -->
<div class="section" class:active={$currentTab === 'acquisto'}>
  <AcquistoForm />
  <div class="toolbar">
    <div class="search-wrap">
      <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input class="search-input" type="text" placeholder="Cerca nella lista..." bind:value={searchQuery} />
    </div>
    <button class="hide-btn" class:active={hideBought} onclick={() => hideBought = !hideBought}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      {hideBought ? 'Mostra tutto' : 'Nascondi comprati'}
    </button>
  </div>
  {#each filtered as group}
    <div class="group-header" class:collapsed={collapsed.has(group.cat.id)} style="color:{group.cat.color}" onclick={() => toggleCat(group.cat.id)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCat(group.cat.id); } }} role="button" tabindex="0">
      <span class="group-icon">{@html group.cat.svg.replace('width="18" height="18"', 'width="14" height="14"')}</span>
      <span>{group.cat.label} ({group.items.length})</span>
      <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      <button class="svuota-btn" onclick={(e) => { e.stopPropagation(); svuotaCat(group.cat.id); }} aria-label="Svuota categoria">Svuota</button>
    </div>
    {#if !collapsed.has(group.cat.id)}
      {#each group.items as item (item._k)}
        <AcquistoCard {item} />
      {/each}
    {/if}
  {:else}
    <div class="empty">Nessun articolo in lista</div>
  {/each}
</div>

<!-- CASA -->
<div class="section" class:active={$currentTab === 'casa'}>
  <WishForm />
  {#each $wishes as wish (wish._k)}
    <WishCard {wish} />
  {:else}
    <div class="empty">Nessun oggetto salvato</div>
  {/each}
</div>

<!-- MISURE -->
<div class="section" class:active={$currentTab === 'misure'}>
  <MisuraForm />
  {#each $misure as misura (misura._k)}
    <MisuraCard {misura} />
  {:else}
    <div class="empty">Nessuna misura salvata</div>
  {/each}
</div>

<style>
  .group-header {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .6px;
    margin: 6px 0 8px 4px; cursor: pointer; user-select: none;
  }
  .group-icon { display: flex; align-items: center; }
  .chevron { transition: transform .2s; flex-shrink: 0; }
  .collapsed .chevron { transform: rotate(-90deg); }
  .svuota-btn {
    all: unset; margin-left: auto; font-size: 10px; font-weight: 700;
    padding: 3px 10px; border-radius: 8px; cursor: pointer;
    background: var(--bg-secondary); color: var(--text-muted); letter-spacing: .3px;
  }
  .toolbar {
    display: flex; gap: 8px; align-items: center;
    margin: 10px 0 6px;
  }
  .search-wrap {
    flex: 1; position: relative; display: flex; align-items: center;
  }
  .search-icon {
    position: absolute; left: 10px; pointer-events: none;
    color: var(--text-muted);
  }
  .search-input {
    all: unset; width: 100%; padding: 9px 10px 9px 32px; border-radius: 10px;
    border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text-primary);
    font-size: 13px; font-weight: 500; box-sizing: border-box;
  }
  .search-input::placeholder { color: var(--text-muted); }
  .hide-btn {
    all: unset; display: flex; align-items: center; gap: 5px;
    padding: 9px 12px; border-radius: 10px; font-size: 11px; font-weight: 700;
    cursor: pointer; white-space: nowrap; flex-shrink: 0;
    background: var(--bg-secondary); color: var(--text-muted);
    border: 1.5px solid transparent; transition: all .15s;
  }
  .hide-btn.active {
    background: var(--paid-bg); color: var(--color-green);
    border-color: var(--paid-border);
  }
</style>
