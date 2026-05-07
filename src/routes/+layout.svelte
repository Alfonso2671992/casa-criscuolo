<script lang="ts">
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  import TabBar from '$lib/components/TabBar.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import Onboarding from '$lib/components/Onboarding.svelte';
  import LoginForm from '$lib/components/LoginForm.svelte';
  import { names, saveNames, user, showToast } from '$lib/stores';
  import { logout, onAuth } from '$lib/firebase-client';
  import { onMount } from 'svelte';

  let { children }: { children: import('svelte').Snippet } = $props();

  let onboarded = $state(false);
  let authed = $state(false);

  onMount(() => {
    onboarded = !!localStorage.getItem('cc_seen');
    return onAuth((u) => {
      user.set(u);
      authed = true;
    });
  });

  function handleOnboarding(n1: string, n2: string) {
    saveNames({ p1: n1, p2: n2 });
    try { localStorage.setItem('cc_seen', '1'); } catch {}
    onboarded = true;
  }
</script>

<div class="app">
  {#if !onboarded}
    <Onboarding onComplete={handleOnboarding} />
  {:else if !authed}
    <!-- caricamento -->
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
