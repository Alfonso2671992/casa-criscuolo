<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { currentTab, expenses, wishes, misure, cacheExpenses, cacheWishes, cacheMisure, freeNotes, saveFreeNotes } from '$lib/stores';
  import { listenExpenses, listenWishes, listenMisure, listenNote, saveNote } from '$lib/firebase-client';
  import SummaryBar from '$lib/components/SummaryBar.svelte';
  import ExpenseForm from '$lib/components/ExpenseForm.svelte';
  import ExpenseCard from '$lib/components/ExpenseCard.svelte';
  import WishForm from '$lib/components/WishForm.svelte';
  import WishCard from '$lib/components/WishCard.svelte';
  import MisuraForm from '$lib/components/MisuraForm.svelte';
  import MisuraCard from '$lib/components/MisuraCard.svelte';

  let unsubExp = $state<() => void>(() => {});
  let unsubWish = $state<() => void>(() => {});
  let unsubMis = $state<() => void>(() => {});
  let unsubNote = $state<() => void>(() => {});
  let noteTimer: ReturnType<typeof setTimeout> | undefined;

  onMount(() => {
    unsubExp = listenExpenses((data) => cacheExpenses(data));
    unsubWish = listenWishes((data) => cacheWishes(data));
    unsubMis = listenMisure((data) => cacheMisure(data));
    unsubNote = listenNote((text) => {
      saveFreeNotes(text);
      const ta = document.getElementById('freeNotes') as HTMLTextAreaElement | null;
      if (ta && document.activeElement !== ta) ta.value = text;
    });
  });

  onDestroy(() => {
    unsubExp();
    unsubWish();
    unsubMis();
    unsubNote();
  });

  function handleNoteInput(e: Event) {
    const val = (e.target as HTMLTextAreaElement).value;
    saveFreeNotes(val);
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => saveNote(val), 1000);
  }
</script>

<!-- SPESE -->
<div class="section" class:active={$currentTab === 'spese'}>
  <SummaryBar />
  <ExpenseForm />
  <div class="divider">
    <div class="divider-line"></div>
    <span class="divider-label" style="color:#C4622D">Da pagare</span>
    <div class="divider-line"></div>
  </div>
  {#each $expenses.filter(e => e.s === 'da') as exp (exp._k)}
    <ExpenseCard expense={exp} isDa={true} />
  {:else}
    <div class="empty">Nessuna spesa da pagare</div>
  {/each}
  <div class="divider" style="margin-top:8px">
    <div class="divider-line"></div>
    <span class="divider-label" style="color:#6A8A4A">Pagate</span>
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
  <div class="note-card">
    <div class="note-header">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C4622D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      <span>Note libere</span>
    </div>
    <textarea id="freeNotes" class="notepad" placeholder="Scrivi qui..." value={$freeNotes} oninput={handleNoteInput}></textarea>
  </div>
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
  .note-card {
    background: #FDF6EC; border-radius: 16px; border: 1.5px solid #D4A574; overflow: hidden;
  }
  .note-header {
    padding: 13px 16px 11px; border-bottom: 1.5px solid #EDD9C0;
    display: flex; align-items: center; gap: 8px; background: #FDF6EC;
  }
  .note-header span { font-size: 14px; font-weight: 700; color: #3D2010; font-family: Georgia, serif; flex: 1; }
</style>
