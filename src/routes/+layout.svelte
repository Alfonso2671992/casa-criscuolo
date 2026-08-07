<script lang="ts">
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  import TabBar from '$lib/components/TabBar.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import LoginForm from '$lib/components/LoginForm.svelte';
  import MisuraEditModal from '$lib/components/MisuraEditModal.svelte';
  import ExpenseEditModal from '$lib/components/ExpenseEditModal.svelte';
  import WishEditModal from '$lib/components/WishEditModal.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import SettingsModal from '$lib/components/SettingsModal.svelte';
  import RecurringModal from '$lib/components/RecurringModal.svelte';
  import { user, initDark, currentModal, recurringExpenses, showToast } from '$lib/stores';
  import { onAuth, listenRecurring } from '$lib/firebase-client';
  import { fmtEuro } from '$lib/utils';
  import { onMount } from 'svelte';

  let { children }: { children: import('svelte').Snippet } = $props();

  let authed = $state(false);
  let recurringUnsub: (() => void) | null = null;

  function closeModal() { currentModal.set(null); }

  $effect(() => {
    if ($user) {
      recurringUnsub = listenRecurring((data) => {
        recurringExpenses.set(data);
        const todayKey = 'cc_rec_' + new Date().toISOString().slice(0, 10);
        if (!localStorage.getItem(todayKey)) {
          const today = new Date().getDate();
          const due = data.filter(r => r.from <= today && today <= r.to);
          if (due.length > 0) {
            due.forEach((r, i) => {
              setTimeout(() => showToast(`Promemoria: ${r.n} · €${fmtEuro(r.a)}`, 4500), i * 5000);
            });
            localStorage.setItem(todayKey, '1');
          }
        }
      });
    } else {
      recurringUnsub?.();
      recurringUnsub = null;
    }
    return () => { recurringUnsub?.(); recurringUnsub = null; };
  });

  onMount(() => {
    initDark();
    return onAuth((u) => {
      user.set(u);
      authed = true;
    });
  });
</script>

<div class="app">
  {#if !authed}
    <div class="loader"><div class="spinner"></div><span>Caricamento...</span></div>
  {:else if !$user}
    <LoginForm />
  {:else}
    <Header />
    <TabBar />
    <div class="body">
      {@render children()}
    </div>
  {/if}
  <Toast />
</div>

{#if $currentModal?.type === 'misura-edit'}
  <MisuraEditModal misura={$currentModal.misura} onClose={closeModal} />
{:else if $currentModal?.type === 'expense-edit'}
  <ExpenseEditModal expense={$currentModal.expense} onClose={closeModal} />
{:else if $currentModal?.type === 'wish-edit'}
  <WishEditModal wish={$currentModal.wish} onClose={closeModal} />
{:else if $currentModal?.type === 'confirm'}
  <ConfirmDialog message={$currentModal.message} onConfirm={$currentModal.onConfirm} onCancel={$currentModal.onCancel} />
{:else if $currentModal?.type === 'settings'}
  <SettingsModal onClose={closeModal} />
{:else if $currentModal?.type === 'recurring'}
  <RecurringModal onClose={closeModal} />
{:else if $currentModal?.type === 'svuota'}
  <ConfirmDialog message={'Svuotare tutta la categoria?'} onConfirm={$currentModal.onConfirm} onCancel={$currentModal.onCancel} />
{/if}

<style>
  .loader {
    position: fixed; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px;
    background: var(--bg-app); color: var(--text-muted);
    font-size: 14px; font-weight: 600;
  }
  .spinner {
    width: 28px; height: 28px; border: 3px solid var(--border);
    border-top-color: var(--accent); border-radius: 50%;
    animation: spin .8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
