<script lang="ts">
  import { login, register, resetPassword } from '$lib/firebase-client';
  import { showToast } from '$lib/stores';

  let email = $state('');
  let password = $state('');
  let isRegister = $state(false);
  let loading = $state(false);
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
      window.location.reload();
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
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
      </div>
      <div>
        <div class="title">Casa Criscuolo</div>
        <div class="accent">/ Falabella</div>
      </div>
    </div>

    {#if showReset}
      <div class="subtitle">Inserisci email per il reset password</div>
      <form onsubmit={handleReset}>
        <input class="inp" type="email" placeholder="La tua email" bind:value={resetEmail} />
        <button class="btn-primary" type="submit">Invia email reset</button>
      </form>
      <button class="btn-link" onclick={() => showReset = false}>Torna al login</button>
    {:else}
      <div class="subtitle">{isRegister ? 'Crea un account' : 'Accedi per continuare'}</div>
      <form onsubmit={submit}>
        <input class="inp" type="email" placeholder="Email" bind:value={email} />
        <input class="inp" type="password" placeholder="Password" bind:value={password} />
        <button class="btn-primary" type="submit" disabled={loading}>
          {loading ? '...' : (isRegister ? 'Registrati' : 'Accedi')}
        </button>
      </form>
      {#if !isRegister}
        <button class="btn-link" onclick={() => { showReset = true; resetEmail = email; }}>Password dimenticata?</button>
      {/if}
      <button class="btn-link" onclick={toggleMode}>
        {isRegister ? 'Hai gi\u00E0 un account? Accedi' : 'Non hai un account? Registrati'}
      </button>
    {/if}
  </div>
</div>

<style>
  .overlay {
    position: fixed; inset: 0; z-index: 200;
    display: flex; align-items: center; justify-content: center;
    background: #FAF3E8;
  }
  .box { width: 320px; max-width: 92vw; text-align: center; }
  form { width: 100%; }
  .icon-wrap {
    width: 48px; height: 48px; border-radius: 14px;
    background: #C4622D; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .title { font-size: 20px; font-weight: 700; color: #3D2010; font-family: Georgia, serif; line-height: 1.2; text-align: left; }
  .accent { font-size: 13px; font-weight: 600; color: #C4622D; font-family: Georgia, serif; font-style: italic; text-align: left; }
  .subtitle { font-size: 14px; color: #8B6040; font-weight: 500; margin: 16px 0 20px; }
  .inp {
    all: unset; display: block; width: 100%; padding: 10px 12px; border-radius: 10px;
    border: 1.5px solid #D4A574; background: #FAF3E8; color: #3D2010;
    font-size: 14px; font-weight: 500; margin-bottom: 10px; box-sizing: border-box;
  }
  .btn-primary {
    all: unset; display: block; width: 100%; padding: 13px; border-radius: 12px;
    background: #C4622D; color: #FFF; font-size: 15px; font-weight: 700;
    text-align: center; cursor: pointer; box-sizing: border-box; margin-top: 4px;
  }
  .btn-primary:disabled { opacity: .6; }
  .btn-link {
    all: unset; display: block; width: 100%; margin-top: 14px;
    font-size: 13px; color: #A07850; font-weight: 600; cursor: pointer;
    text-decoration: underline; text-align: center;
  }
</style>
