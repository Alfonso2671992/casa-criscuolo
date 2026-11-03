<script lang="ts">
  import { login, register, resetPassword } from '$lib/firebase-client';
  import { showToast } from '$lib/stores';

  let email = $state('');
  let password = $state('');
  let isRegister = $state(false);
  let loading = $state(false);
  let showPassword = $state(false);
  let showReset = $state(false);
  let resetEmail = $state('');

  async function submit(e?: Event) {
    e?.preventDefault();
    if (!email.trim() || !password.trim()) { showToast('Inserisci email e password'); return; }
    if (password.length < 6) { showToast('Password: almeno 6 caratteri'); return; }
    loading = true;
    try {
      if (isRegister) await register(email, password);
      else await login(email, password);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential'))
        showToast('Email o password errati');
      else if (msg.includes('email-already-in-use'))
        showToast('Email già registrata');
      else
        showToast('Errore di accesso');
    } finally { loading = false; }
  }

  function toggleMode() {
    isRegister = !isRegister;
    showReset = false;
  }

  async function handleReset(e?: Event) {
    e?.preventDefault();
    if (!resetEmail.trim()) { showToast('Inserisci email'); return; }
    try {
      await resetPassword(resetEmail.trim());
      showToast('Email di reset inviata');
      showReset = false;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('user-not-found'))
        showToast('Nessun account con questa email');
      else
        showToast('Errore invio email');
    }
  }
</script>

<div class="overlay">
  <div class="box">
    <div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:8px">
      <div class="icon-wrap">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
      </div>
      <div>
        <div class="title">Casa Criscuolo</div>
        <div class="accent">/ Falabella</div>
      </div>
    </div>

    {#if showReset}
      <div class="subtitle">Inserisci email per il reset password</div>
      <form onsubmit={handleReset}>
        <input class="inp" type="email" placeholder="La tua email" aria-label="Email" bind:value={resetEmail} />
        <button class="btn-primary" type="submit">Invia email reset</button>
      </form>
      <button class="btn-link" onclick={() => showReset = false}>Torna al login</button>
    {:else}
      <div class="subtitle">{isRegister ? 'Crea un account' : 'Accedi per continuare'}</div>
      <form onsubmit={submit}>
        <input class="inp" type="email" placeholder="Email" aria-label="Email" bind:value={email} />
        <div class="pw-wrap">
          <input class="inp pw-inp" type={showPassword ? 'text' : 'password'} placeholder="Password" aria-label="Password" bind:value={password} />
          <button class="pw-toggle" type="button" onclick={() => showPassword = !showPassword} aria-label={showPassword ? 'Nascondi password' : 'Mostra password'} aria-pressed={showPassword}>
            {#if showPassword}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.8 11.8 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>
            {:else}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
            {/if}
          </button>
        </div>
        <button class="btn-primary" type="submit" disabled={loading}>
          {loading ? '...' : (isRegister ? 'Registrati' : 'Accedi')}
        </button>
      </form>
      {#if !isRegister}
        <button class="btn-link" onclick={() => { showReset = true; resetEmail = email; }}>Password dimenticata?</button>
      {/if}
      {#if isRegister}
        <button class="btn-link" onclick={toggleMode}>Hai gi\u00E0 un account? Accedi</button>
      {/if}
    {/if}
  </div>
</div>

<style>
  .overlay {
    position: fixed; inset: 0; z-index: 200;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg-app);
  }
  .box { width: 320px; max-width: 92vw; text-align: center; }
  form { width: 100%; }
  .icon-wrap {
    width: 48px; height: 48px; border-radius: 14px;
    background: var(--accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .title { font-size: 20px; font-weight: 700; color: var(--text-primary); font-family: var(--font-serif); line-height: 1.2; text-align: left; }
  .accent { font-size: 13px; font-weight: 600; color: var(--accent); font-family: var(--font-serif); font-style: italic; text-align: left; }
  .subtitle { font-size: 14px; color: var(--text-secondary); font-weight: 500; margin: 16px 0 20px; }
  .inp {
    all: unset; display: block; width: 100%; padding: 10px 12px; border-radius: 10px;
    border: 1.5px solid var(--border); background: var(--bg-app); color: var(--text-primary);
    font-size: 14px; font-weight: 500; margin-bottom: 10px; box-sizing: border-box;
  }
  .pw-wrap { position: relative; margin-bottom: 10px; }
  .pw-inp { padding-left: 40px; padding-right: 40px; margin-bottom: 0; }
  .pw-toggle {
    all: unset; position: absolute; top: 0; right: 0; width: 40px; height: 100%;
    display: flex; align-items: center; justify-content: center;
    color: var(--text-primary); cursor: pointer;
  }
  .btn-primary {
    all: unset; display: block; width: 100%; padding: 13px; border-radius: 12px;
    background: var(--accent); color: var(--color-white); font-size: 15px; font-weight: 700;
    text-align: center; cursor: pointer; box-sizing: border-box; margin-top: 4px;
  }
  .btn-primary:disabled { opacity: .6; }
  .btn-link {
    all: unset; display: block; width: 100%; margin-top: 14px;
    font-size: 13px; color: var(--text-muted); font-weight: 600; cursor: pointer;
    text-decoration: underline; text-align: center;
  }
</style>
