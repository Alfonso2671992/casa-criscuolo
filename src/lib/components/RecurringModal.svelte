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
  let editingId = $state<string | null>(null);
  let confirmingId = $state<string | null>(null);

  function startEdit(r: { _k?: string; n: string; a: number; from: number; to: number }) {
    editingId = r._k!;
    recName = r.n;
    recAmount = String(r.a);
    recFrom = String(r.from);
    recTo = String(r.to);
  }

  function cancelEdit() {
    editingId = null;
    recName = ''; recAmount = ''; recFrom = ''; recTo = '';
  }

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
    if (editingId) {
      const res = await authFetch(`/api/recurring/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      saving = false;
      if (!res.ok) { showToast('Errore salvataggio'); return; }
      cancelEdit();
    } else {
      const res = await authFetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      saving = false;
      if (!res.ok) { showToast('Errore salvataggio'); return; }
      recName = ''; recAmount = ''; recFrom = ''; recTo = '';
    }
  }

  async function del(k: string) {
    const res = await authFetch(`/api/recurring/${k}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (!res.ok) showToast('Errore eliminazione');
    confirmingId = null;
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
          <li class="item" class:editing={editingId === r._k}>
            {#if confirmingId === r._k}
              <div class="confirm-row">
                <span class="confirm-msg">Eliminare "{r.n}"?</span>
                <button class="btn-yes" onclick={() => del(r._k!)}>Sì</button>
                <button class="btn-no" onclick={() => confirmingId = null}>No</button>
              </div>
            {:else}
              <div class="item-info">
                <span class="item-name">{r.n}</span>
                <span class="item-meta">€{fmtEuro(r.a)} · dal {r.from} al {r.to} del mese</span>
              </div>
              <div class="item-actions">
                <button class="btn-edit" onclick={() => startEdit(r)} aria-label="Modifica">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn-del" onclick={() => confirmingId = r._k!} aria-label="Elimina">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                </button>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty">Nessuna spesa fissa aggiunta</p>
    {/if}

    <div class="form">
      <div class="form-title">{editingId ? 'Modifica' : 'Nuova spesa fissa'}</div>
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
      <div class="form-actions">
        {#if editingId}
          <button class="btn-cancel" onclick={cancelEdit}>Annulla</button>
        {/if}
        <button class="btn-add" onclick={save} disabled={saving}>
          {saving ? '…' : editingId ? 'Salva' : '+ Aggiungi'}
        </button>
      </div>
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
  .item.editing { background: var(--bg-secondary); border-radius: 10px; padding: 10px 8px; margin: 0 -8px; border-bottom: none; }
  .item-info { flex: 1; min-width: 0; }
  .item-name { font-size: 14px; font-weight: 600; color: var(--text-primary); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .item-meta { font-size: 12px; color: var(--text-muted); font-weight: 500; }
  .item-actions { display: flex; gap: 6px; flex-shrink: 0; }
  .confirm-row { display: flex; align-items: center; gap: 8px; width: 100%; }
  .confirm-msg { flex: 1; font-size: 13px; font-weight: 600; color: var(--text-primary); }
  .btn-yes { all: unset; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; background: var(--scaduta-border); color: var(--color-white); }
  .btn-no { all: unset; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; background: var(--bg-secondary); color: var(--text-muted); }
  .btn-edit { all: unset; width: 32px; height: 32px; border-radius: 9px; cursor: pointer; display: flex; align-items: center; justify-content: center; background: var(--accent); color: var(--color-white); }
  .btn-del { all: unset; width: 32px; height: 32px; border-radius: 9px; cursor: pointer; display: flex; align-items: center; justify-content: center; background: var(--bg-secondary); color: var(--color-brown); }
  .empty { font-size: 13px; color: var(--text-muted); margin: 0 0 4px; }
  .form { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
  .form-title { font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: .4px; }
  .inp { all: unset; display: block; width: 100%; padding: 10px 12px; border-radius: 10px; background: var(--bg-secondary); border: 1.5px solid var(--border); font-size: 14px; color: var(--text-primary); box-sizing: border-box; }
  .row { display: flex; gap: 10px; }
  .field { flex: 1; display: flex; flex-direction: column; gap: 4px; }
  .lbl { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .4px; }
  .form-actions { display: flex; gap: 8px; margin-top: 4px; }
  .btn-add { all: unset; flex: 1; padding: 12px; border-radius: 12px; font-size: 14px; font-weight: 700; text-align: center; cursor: pointer; box-sizing: border-box; background: var(--accent); color: var(--color-white); }
  .btn-add:disabled { opacity: .6; }
  .btn-cancel { all: unset; flex: 1; padding: 12px; border-radius: 12px; font-size: 14px; font-weight: 700; text-align: center; cursor: pointer; box-sizing: border-box; background: var(--bg-secondary); color: var(--text-muted); }
</style>
