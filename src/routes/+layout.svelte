<script lang="ts">
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  import TabBar from '$lib/components/TabBar.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import LoginForm from '$lib/components/LoginForm.svelte';
  import { user } from '$lib/stores';
  import { onAuth } from '$lib/firebase-client';
  import { onMount } from 'svelte';

  let { children }: { children: import('svelte').Snippet } = $props();

  let authed = $state(false);

  onMount(() => {
    return onAuth((u) => {
      user.set(u);
      authed = true;
    });
  });
</script>

<div class="app">
  {#if !authed}
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
