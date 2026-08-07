<script lang="ts">
  import { trapFocus, scrollLock, fmtEuro, cap } from '$lib/utils';
  import { authFetch } from '$lib/firebase-client';
  import { showToast, recurringExpenses } from '$lib/stores';

  let { onClose }: { onClose: () => void } = $props();

  let recName = $state('');
  let recAmount = $state('');
  let recFrom = $state('');
  let recTo = $state('');
  let saving = $state(false);

  function validate() {
    const n = cap(recName.trim().slice(0, 200));
    const a = parseFloat(recAmount);
    const from = parseInt(recFrom);
    const to = parseInt(recTo);
    if (!n || isNaN(a) || a < 0 || isNaN(from) || from < 1 || from > 31 || isNaN(to) || to < from || to > 31) {
      showToast('Dati non validi');
      return null;
    }
    return { n, a: +a.toFixed(2), from, to };
  }

  async function save() {
    const data = validate();
    if (!data) return;
    saving = true;
    const res = await authFetch('/api/recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    saving = false;
    if (!res.ok) { showToast('Errore salvataggio'); return; }
    recName = ''; recAmount = ''; recFrom = ''; recTo = '';
  }

  async function del(k: string) {
    const res = await authFetch(`/api/recurring/${k}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (!res.ok) showToast('Errore eliminazione');
  }
</script>

<div class="overlay" onclick={onClose} role="presentation" use:trapFocus use:scrollLock>
  <div class="box" onclick={(e) => e.stopPropagation()} onkeydown={(e) => { if (e.key === 'Escape') onClose(); }} role="dialog" tabindex="-1">
    <div class="modal-header">
      <span class="modal-title">Spese fisse</span>
      <button class="btn-x" onclick={onClose} aria-label="Chiudi">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    {#if $recurringExpenses.length > 0}
      <ul class="list">
        {#each $recurringExpenses as r (r._k)}
          <li class="item">
            <div class="item-info">
              <span class="item-name">{r.n}</span>
              <span class="item-meta">€{fmtEuro(r.a)} · dal {r.from} al {r.to} del mese</span>
            </div>
            <button class="btn-del" onclick={() => del(r._k!)} aria-label="Elimina">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty">Nessuna spesa fissa aggiunta</p>
    {/if}

    <div class="form">
      <div class="form-title">Nuova spesa fissa</div>
      <input class="inp" type="text" placeholder="Nome (es. Parcheggio)" bind:value={recName} maxlength="200" />
      <input class="inp" type="number" placeholder="Importo (€)" min="0" step="0.01" bind:value={recAmount} />
      <div class="row">
        <div class="field">
          <label class="lbl" for="rec-from">Dal giorno</label>
          <input id="rec-from" class="inp" type="number" placeholder="1" min="1" max="31" bind:value={recFrom} />
        </div>
        <div class="field">
          <label class="lbl" for="rec-to">Al giorno</label>
          <input id="rec-to" class="inp" type="number" placeholder="31" min="1" max="31" bind:value={recTo} />
        </div>
      </div>
      <button class="btn-add" onclick={save} disabled={saving}>
        {saving ? '…' : '+ Aggiungi'}
      </button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed; inset: 0; background: var(--overlay-bg); z-index: 100;
    display: flex; align-items: center; justify-content: center;
    padding: calc(env(safe-area-inset-top) + 60px) 0 50px;
  }
  .box {
    background: var(--bg-card); border-radius: 18px; padding: 20px 24px 24px;
    width: 320px; max-width: 92vw; display: flex; flex-direction: column;
    max-height: 88vh; overflow-y: auto;
  }
  .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .modal-title { font-size: 16px; font-weight: 700; color: var(--text-primary); }
  .btn-x { all: unset; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; padding: 4px; }
  .list { list-style: none; margin: 0 0 4px; padding: 0; }
  .item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border-light); }
  .item-info { flex: 1; min-width: 0; }
  .item-name { font-size: 14px; font-weight: 600; color: var(--text-primary); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .item-meta { font-size: 12px; color: var(--text-muted); font-weight: 500; }
  .btn-del { all: unset; width: 32px; height: 32px; border-radius: 9px; cursor: pointer; display: flex; align-items: center; justify-content: center; background: var(--bg-secondary); color: var(--color-brown); flex-shrink: 0; }
  .empty { font-size: 13px; color: var(--text-muted); margin: 0 0 4px; }
  .form { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
  .form-title { font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: .4px; }
  .inp { all: unset; display: block; width: 100%; padding: 10px 12px; border-radius: 10px; background: var(--bg-secondary); border: 1.5px solid var(--border); font-size: 14px; color: var(--text-primary); box-sizing: border-box; }
  .row { display: flex; gap: 10px; }
  .field { flex: 1; display: flex; flex-direction: column; gap: 4px; }
  .lbl { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .4px; }
  .btn-add { all: unset; width: 100%; padding: 12px; border-radius: 12px; font-size: 14px; font-weight: 700; text-align: center; cursor: pointer; box-sizing: border-box; background: var(--accent); color: var(--color-white); margin-top: 4px; }
  .btn-add:disabled { opacity: .6; }
</style>
