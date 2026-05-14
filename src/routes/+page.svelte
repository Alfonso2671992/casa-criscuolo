<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { currentTab, expenses, wishes, misure, acquisti, cacheExpenses, cacheWishes, cacheMisure, cacheAcquisti, showToast } from '$lib/stores';
  import { listenExpenses, listenWishes, listenMisure, listenAcquisti, authFetch } from '$lib/firebase-client';
  import { ACQUISTO_CATS } from '$lib/constants';
  import { groupAcquisti } from '$lib/group-acquisti';
  import { sortDaPagare } from '$lib/utils';
  import SummaryBar from '$lib/components/SummaryBar.svelte';
  import BudgetBar from '$lib/components/BudgetBar.svelte';
  import ExpenseForm from '$lib/components/ExpenseForm.svelte';
  import ExpenseCard from '$lib/components/ExpenseCard.svelte';
  import WishForm from '$lib/components/WishForm.svelte';
  import WishCard from '$lib/components/WishCard.svelte';
  import MisuraForm from '$lib/components/MisuraForm.svelte';
  import MisuraCard from '$lib/components/MisuraCard.svelte';
  import AcquistoForm from '$lib/components/AcquistoForm.svelte';
  import AcquistoCard from '$lib/components/AcquistoCard.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

  let unsubExp = $state<() => void>(() => {});
  let unsubWish = $state<() => void>(() => {});
  let unsubMis = $state<() => void>(() => {});
  let unsubAcq = $state<() => void>(() => {});

  let collapsed = $state(new Set<string>(['__paid', '__budget']));
  let confirmSvuota = $state<string | null>(null);
  let loaded = $state({ exp: false, wish: false, mis: false, acq: false });

  function toggleCat(id: string) {
    const next = new Set(collapsed);
    if (next.has(id)) next.delete(id); else next.add(id);
    collapsed = next;
  }

  let grouped = $derived(groupAcquisti($acquisti, ACQUISTO_CATS));

  async function svuotaCat(cat: string) {
    const res = await authFetch('/api/acquisto', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ c: cat }),
    });
    if (!res.ok) { const d = await res.json(); showToast(d?.error || 'Errore'); return; }
    showToast('Categoria svuotata');
    confirmSvuota = null;
  }

  onMount(() => {
    unsubExp = listenExpenses((data) => { cacheExpenses(data); loaded.exp = true; });
    unsubWish = listenWishes((data) => { cacheWishes(data); loaded.wish = true; });
    unsubMis = listenMisure((data) => { cacheMisure(data); loaded.mis = true; });
    unsubAcq = listenAcquisti((data) => { cacheAcquisti(data); loaded.acq = true; });
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
  <div class="group-header" class:collapsed={collapsed.has('__dapagare')} style="color:var(--accent)" onclick={() => toggleCat('__dapagare')} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCat('__dapagare'); } }} role="button" tabindex="0">
    <span>Da pagare</span>
    <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
  </div>
  {#if !collapsed.has('__dapagare')}
    {#each $expenses.filter(e => e.s === 'da').sort(sortDaPagare) as exp (exp._k)}
      <ExpenseCard expense={exp} isDa={true} />
    {:else}
      {#if loaded.exp}
        <div class="empty">Nessuna spesa da pagare</div>
      {:else}
        <div class="skel"></div>
      {/if}
    {/each}
  {/if}
  <div class="group-header" class:collapsed={collapsed.has('__paid')} style="color:var(--color-green)" onclick={() => toggleCat('__paid')} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCat('__paid'); } }} role="button" tabindex="0">
    <span>Pagate</span>
    <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
  </div>
  {#if !collapsed.has('__paid')}
    {#each $expenses.filter(e => e.s === 'ok') as exp (exp._k)}
      <ExpenseCard expense={exp} isDa={false} />
    {:else}
      {#if loaded.exp}
        <div class="empty">Nessuna spesa pagata</div>
      {:else}
        <div class="skel"></div>
      {/if}
    {/each}
  {/if}
  <div class="group-header" class:collapsed={collapsed.has('__budget')} style="color:var(--accent)" onclick={() => toggleCat('__budget')} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCat('__budget'); } }} role="button" tabindex="0">
    <span>Riepilogo Spese</span>
    <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
  </div>
  {#if !collapsed.has('__budget')}
    <div class="budget-section">
      <BudgetBar />
    </div>
  {/if}
</div>

<!-- DA ACQUISTARE -->
<div class="section" class:active={$currentTab === 'acquisto'}>
  <AcquistoForm />
  {#each grouped as group}
    <div class="group-header" class:collapsed={collapsed.has(group.cat.id)} style="color:{group.cat.color}" onclick={() => toggleCat(group.cat.id)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCat(group.cat.id); } }} role="button" tabindex="0">
      <span class="group-icon">{@html group.cat.svg.replace('width="18" height="18"', 'width="14" height="14"')}</span>
      <span>{group.cat.label} ({group.activeCount})</span>
      <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      <button class="svuota-btn" onclick={(e) => { e.stopPropagation(); confirmSvuota = group.cat.id; }} aria-label="Svuota categoria">Svuota</button>
    </div>
    {#if !collapsed.has(group.cat.id)}
      {#each group.items as item (item._k)}
        <AcquistoCard {item} />
      {/each}
    {/if}
  {:else}
    {#if loaded.acq}
      <div class="empty">Nessun articolo in lista</div>
    {:else}
      <div class="skel"></div>
    {/if}
  {/each}
</div>
{#if confirmSvuota}
  <ConfirmDialog message="Svuotare tutta la categoria?" onConfirm={() => { if (confirmSvuota) svuotaCat(confirmSvuota); }} onCancel={() => confirmSvuota = null} />
{/if}

<!-- CASA -->
<div class="section" class:active={$currentTab === 'casa'}>
  <WishForm />
  {#each $wishes as wish (wish._k)}
    <WishCard {wish} />
  {:else}
    {#if loaded.wish}
      <div class="empty">Nessun oggetto salvato</div>
    {:else}
      <div class="skel"></div>
    {/if}
  {/each}
</div>

<!-- MISURE -->
<div class="section" class:active={$currentTab === 'misure'}>
  <MisuraForm />
  {#each $misure as misura (misura._k)}
    <MisuraCard {misura} />
  {:else}
    {#if loaded.mis}
      <div class="empty">Nessuna misura salvata</div>
    {:else}
      <div class="skel"></div>
    {/if}
  {/each}
</div>

<style>
  .group-header {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .6px;
    margin: 6px 0 8px 4px; cursor: pointer; user-select: none;
  }
  .group-header:not(:first-child) { margin-top: 16px; }
  .group-icon { display: flex; align-items: center; }
  .chevron { transition: transform .2s; flex-shrink: 0; }
  .collapsed .chevron { transform: rotate(-90deg); }
  .svuota-btn {
    all: unset; margin-left: auto; font-size: 10px; font-weight: 700;
    padding: 3px 10px; border-radius: 8px; cursor: pointer;
    background: var(--accent); color: var(--color-white); letter-spacing: .3px;
  }
  .budget-section { background: var(--bg-card); border-radius: 16px; padding: 12px 14px; margin-bottom: 10px; border: 1.5px solid var(--border-light); }
</style>
