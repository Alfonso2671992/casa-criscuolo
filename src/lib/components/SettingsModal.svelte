<script lang="ts">
  import { trapFocus, scrollLock } from '$lib/utils';
  import { logout, auth } from '$lib/firebase-client';
  import { showToast, darkMode } from '$lib/stores';
  import { pushSupport, pushEnabled, enablePush, disablePush, sendTestPush, type PushSupport } from '$lib/push';

  let { onClose }: { onClose: () => void } = $props();

  const email = $derived(auth.currentUser?.email ?? '');
  const initial = $derived((email || 'A').charAt(0).toUpperCase());
  const colors = [
    { bg: '#C2185B', text: '#FFF' },
    { bg: '#C4622D', text: '#FFF' },
  ];
  const colorIdx = $derived.by(() => {
    let h = 0;
    for (let i = 0; i < email.length; i++) h += email.charCodeAt(i);
    return h % colors.length;
  });
  const { bg, text } = $derived(colors[colorIdx]);

  let support = $state<PushSupport | null>(null);
  let pushOn = $state(pushEnabled());
  let busy = $state(false);
  let denied = $state(false);

  $effect(() => { pushSupport().then(v => { support = v; }); });

  // enablePush must start synchronously from the tap: iOS requires the permission prompt inside the gesture
  function togglePush() {
    if (busy || support !== 'ok') return;
    busy = true;
    denied = false;
    if (pushOn) {
      disablePush().then(() => { pushOn = false; }).finally(() => { busy = false; });
      return;
    }
    enablePush().then(r => {
      if (r === 'on') pushOn = true;
      else if (r === 'denied') denied = true;
      else showToast('Attivazione non riuscita, riprova');
    }).finally(() => { busy = false; });
  }

  async function testPush() {
    showToast((await sendTestPush()) ? 'Notifica inviata' : 'Invio non riuscito');
  }

  async function handleLogout() {
    await logout();
    showToast('Disconnesso');
    onClose();
  }

  function toggleDark() {
    const next = !$darkMode;
    darkMode.set(next);
    try { localStorage.setItem('cc_dark', String(next)); } catch {}
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  }
</script>

<div class="overlay" onclick={onClose} role="presentation" use:trapFocus use:scrollLock>
  <div class="box" onclick={(e) => e.stopPropagation()} onkeydown={(e) => { if (e.key === 'Escape') onClose(); }} role="dialog" tabindex="-1">
    <button class="btn-x" onclick={onClose} aria-label="Chiudi">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="avatar" style="background:{bg};color:{text}">{initial}</div>
    <div class="email">{email}</div>
    <button class="btn-dark" onclick={toggleDark}>
      {#if $darkMode}
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        <span>Modalità chiara</span>
      {:else}
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        <span>Modalità scura</span>
      {/if}
    </button>
    <div class="push-row">
      <span>Notifiche</span>
      <button class="switch" class:on={pushOn} role="switch" aria-checked={pushOn} aria-label="Notifiche" disabled={busy || support !== 'ok'} onclick={togglePush}><span class="knob"></span></button>
    </div>
    {#if support === 'need-home'}
      <div class="push-note">Aggiungi l'app alla schermata Home per ricevere le notifiche</div>
    {:else if support === 'unsupported'}
      <div class="push-note">Questo browser non supporta le notifiche</div>
    {:else if denied}
      <div class="push-note">Attiva le notifiche per Casa nelle Impostazioni dell'iPhone</div>
    {/if}
    {#if pushOn}
      <button class="btn-dark" onclick={testPush}>Invia notifica di prova</button>
    {/if}
    <button class="btn-logout" onclick={handleLogout}>Disconnetti</button>
  </div>
</div>

<style>
  .overlay {
    position: fixed; inset: 0; background: var(--overlay-bg); z-index: 100;
    display: flex; align-items: center; justify-content: center;
    padding: calc(env(safe-area-inset-top) + 110px) 0 50px;
  }
  .box {
    position: relative;
    background: var(--bg-card); border-radius: 18px; padding: 28px;
    width: 280px; max-width: 92vw; display: flex; flex-direction: column; align-items: center;
  }
  .avatar {
    width: 48px; height: 48px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; font-weight: 800; margin-bottom: 10px;
  }
  .email { font-size: 13px; color: var(--text-secondary); font-weight: 500; margin-bottom: 18px; word-break: break-all; text-align: center; }
  .btn-dark {
    all: unset; display: flex; align-items: center; justify-content: center; gap: 6px;
    width: 100%; padding: 11px; border-radius: 12px; margin-bottom: 10px;
    font-size: 13px; font-weight: 600; text-align: center; cursor: pointer;
    box-sizing: border-box; background: var(--bg-secondary); color: var(--text-primary);
    border: 1.5px solid var(--border);
  }
  .push-row {
    display: flex; align-items: center; justify-content: space-between;
    width: 100%; padding: 8px 11px 8px 14px; border-radius: 12px; margin-bottom: 10px;
    font-size: 13px; font-weight: 600; box-sizing: border-box;
    background: var(--bg-secondary); color: var(--text-primary); border: 1.5px solid var(--border);
  }
  .switch {
    all: unset; position: relative; width: 44px; height: 26px; border-radius: 13px;
    background: var(--border); cursor: pointer; transition: background .2s; flex-shrink: 0;
  }
  .switch.on { background: var(--accent); }
  .switch:disabled { opacity: .5; cursor: default; }
  .knob {
    position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%;
    background: var(--color-white); transition: transform .2s;
  }
  .switch.on .knob { transform: translateX(18px); }
  .push-note { width: 100%; font-size: 13px; color: var(--text-secondary); margin: -2px 0 10px; text-align: center; }
  /* Same close button as the other modals */
  .btn-x {
    all: unset; position: absolute; top: 18px; right: 20px; cursor: pointer;
    color: var(--text-muted); display: flex; align-items: center; padding: 4px;
  }
  .btn-logout {
    all: unset; display: block; width: 100%; padding: 11px; border-radius: 12px;
    font-size: 14px; font-weight: 700; text-align: center; cursor: pointer;
    box-sizing: border-box;
  }
  .btn-logout { background: var(--accent); color: var(--color-white); }
</style>
