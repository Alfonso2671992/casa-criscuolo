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
  import ReminderPopup from '$lib/components/ReminderPopup.svelte';
  import { user, initDark, currentTab, currentModal, cacheRecurring } from '$lib/stores';
  import { onAuth, listenRecurring } from '$lib/firebase-client';
  import { tabFromUrl, tabFromSwMessage, refreshPush } from '$lib/push';
  import { onMount } from 'svelte';

  let { children }: { children: import('svelte').Snippet } = $props();

  let authed = $state(false);
  let recurringUnsub: (() => void) | null = null;
  let pushStarted = false;

  function closeModal() { currentModal.set(null); }

  // Notification tapped while the app was already open: the service worker tells us which tab to show
  function onSwMessage(e: MessageEvent) {
    const t = tabFromSwMessage(e.data);
    if (t) currentTab.set(t);
  }

  $effect(() => {
    if ($user) {
      recurringUnsub = listenRecurring(cacheRecurring);
    } else {
      recurringUnsub?.();
      recurringUnsub = null;
    }
    return () => { recurringUnsub?.(); recurringUnsub = null; };
  });

  onMount(() => {
    initDark();
    const t = tabFromUrl(location.search);
    if (t) {
      currentTab.set(t);
      history.replaceState(null, '', '/');
    }
    navigator.serviceWorker?.addEventListener('message', onSwMessage);
    const unsubAuth = onAuth((u) => {
      user.set(u);
      authed = true;
      if (u && !pushStarted) {
        pushStarted = true;
        refreshPush();
      }
    });
    return () => {
      navigator.serviceWorker?.removeEventListener('message', onSwMessage);
      unsubAuth();
    };
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
    <ReminderPopup />
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
