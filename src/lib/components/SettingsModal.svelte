<script lang="ts">
  import { trapFocus, scrollLock, fmtEuro, cap } from '$lib/utils';
  import { logout, auth, authFetch } from '$lib/firebase-client';
  import { showToast, darkMode, recurringExpenses } from '$lib/stores';

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

  let recName = $state('');
  let recAmount = $state('');
  let recFrom = $state('');
  let recTo = $state('');
  let recSaving = $state(false);

  async function addRecurring() {
    const n = cap(recName.trim().slice(0, 200));
    const a = parseFloat(recAmount);
    const from = parseInt(recFrom);
    const to = parseInt(recTo);
    if (!n || isNaN(a) || a < 0 || isNaN(from) || from < 1 || from > 31 || isNaN(to) || to < from || to > 31) {
      showToast('Dati non validi');
      return;
    }
    recSaving = true;
    const res = await authFetch('/api/recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ n, a, from, to }),
    });
    recSaving = false;
    if (!res.ok) { showToast('Errore salvataggio'); return; }
    recName = ''; recAmount = ''; recFrom = ''; recTo = '';
  }

  async function deleteRecurring(k: string) {
    const res = await authFetch(`/api/recurring/${k}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (!res.ok) showToast('Errore eliminazione');
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
    <div class="avatar" style="background:{bg};color:{text}">{initial}</div>
    <div class="email">{email}</div>
    <div class="rec-section">
      <div class="rec-title">Spese fisse</div>
      {#if $recurringExpenses.length > 0}
        <ul class="rec-list">
          {#each $recurringExpenses as r (r._k)}
            <li class="rec-item">
              <div class="rec-info">
                <span class="rec-name">{r.n}</span>
                <span class="rec-meta">€{fmtEuro(r.a)} · dal {r.from} al {r.to}</span>
              </div>
              <button class="rec-del" onclick={() => deleteRecurring(r._k!)} aria-label="Elimina">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
              </button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="rec-empty">Nessuna spesa fissa</p>
      {/if}
      <input class="rec-input" type="text" placeholder="Nome" bind:value={recName} maxlength="200" />
      <div class="rec-row">
        <input class="rec-input rec-amt" type="number" placeholder="€" min="0" step="0.01" bind:value={recAmount} />
        <input class="rec-input rec-day" type="number" placeholder="Dal" min="1" max="31" bind:value={recFrom} />
        <input class="rec-input rec-day" type="number" placeholder="Al" min="1" max="31" bind:value={recTo} />
      </div>
      <button class="rec-add" onclick={addRecurring} disabled={recSaving}>
        {recSaving ? '…' : '+ Aggiungi'}
      </button>
    </div>
    <button class="btn-dark" onclick={toggleDark}>
      {#if $darkMode}
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        <span>Modalità chiara</span>
      {:else}
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        <span>Modalità scura</span>
      {/if}
    </button>
    <button class="btn-logout" onclick={handleLogout}>Disconnetti</button>
    <button class="btn-close" onclick={onClose}>Chiudi</button>
  </div>
</div>

<style>
  .overlay {
    position: fixed; inset: 0; background: var(--overlay-bg); z-index: 100;
    display: flex; align-items: center; justify-content: center;
    padding: calc(env(safe-area-inset-top) + 110px) 0 50px;
  }
  .box {
    background: var(--bg-card); border-radius: 18px; padding: 28px;
    width: 300px; max-width: 92vw; display: flex; flex-direction: column; align-items: center;
    max-height: 88vh; overflow-y: auto;
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
  .rec-section { width: 100%; margin-bottom: 14px; }
  .rec-title { font-size: 11px; font-weight: 800; color: var(--text-muted); letter-spacing: .5px; text-transform: uppercase; margin-bottom: 8px; text-align: left; }
  .rec-list { list-style: none; margin: 0 0 8px; padding: 0; }
  .rec-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--border-light); }
  .rec-info { flex: 1; min-width: 0; }
  .rec-name { font-size: 13px; font-weight: 600; color: var(--text-primary); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .rec-meta { font-size: 11px; color: var(--text-muted); font-weight: 500; }
  .rec-del { all: unset; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; background: var(--bg-secondary); color: var(--color-brown); flex-shrink: 0; }
  .rec-empty { font-size: 12px; color: var(--text-muted); text-align: left; margin: 0 0 8px; }
  .rec-input { all: unset; display: block; width: 100%; padding: 8px 10px; border-radius: 9px; background: var(--bg-secondary); border: 1.5px solid var(--border); font-size: 13px; color: var(--text-primary); box-sizing: border-box; margin-bottom: 6px; }
  .rec-row { display: flex; gap: 6px; margin-bottom: 6px; }
  .rec-row .rec-input { margin-bottom: 0; }
  .rec-amt { flex: 2; }
  .rec-day { flex: 1; text-align: center; }
  .rec-add { all: unset; display: block; width: 100%; padding: 9px; border-radius: 10px; font-size: 13px; font-weight: 700; text-align: center; cursor: pointer; box-sizing: border-box; background: var(--accent); color: var(--color-white); }
  .rec-add:disabled { opacity: .6; }
  .btn-logout, .btn-close {
    all: unset; display: block; width: 100%; padding: 11px; border-radius: 12px;
    font-size: 14px; font-weight: 700; text-align: center; cursor: pointer;
    box-sizing: border-box;
  }
  .btn-logout { background: var(--accent); color: var(--color-white); }
  .btn-close { background: transparent; color: var(--text-muted); margin-top: 8px; }
</style>
