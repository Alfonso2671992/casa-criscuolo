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

  let grouped = $derived.by(() => {
    const map = new Map<string, typeof $acquisti>();
    for (const item of $acquisti) {
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
  {#each grouped as group}
    <div class="group-header" style="color:{group.cat.color}">
      <span class="group-icon">{@html group.cat.svg.replace('width="18" height="18"', 'width="14" height="14"')}</span>
      <span>{group.cat.label}</span>
      <button class="svuota-btn" onclick={() => svuotaCat(group.cat.id)} aria-label="Svuota categoria">Svuota</button>
    </div>
    {#each group.items as item (item._k)}
      <AcquistoCard {item} />
    {/each}
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
    margin: 6px 0 8px 4px;
  }
  .group-icon { display: flex; align-items: center; }
  .svuota-btn {
    all: unset; margin-left: auto; font-size: 10px; font-weight: 700;
    padding: 3px 10px; border-radius: 8px; cursor: pointer;
    background: var(--bg-secondary); color: var(--text-muted); letter-spacing: .3px;
  }
</style>
