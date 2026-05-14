<script lang="ts">
  import { CATS, FALLBACK_CAT } from '$lib/constants';
  import { strToDisplay, daysUntil, esc } from '$lib/utils';
  import { showToast } from '$lib/stores';
  import { authFetch } from '$lib/firebase-client';
  import type { Expense } from '$lib/types';
  import ExpenseEditModal from './ExpenseEditModal.svelte';
  import ConfirmDialog from './ConfirmDialog.svelte';

  let { expense, isDa = false }: { expense: Expense; isDa?: boolean } = $props();
  let showEdit = $state(false);
  let confirmDel = $state(false);

  const cat = $derived(CATS.find(c => c.id === expense.c) || FALLBACK_CAT);
  const payerText = $derived(expense.payer === 'A metà' ? `A metà · €${expense.half} a testa` : expense.payer);
  const days = $derived(expense.sc ? daysUntil(expense.sc) : null);
  const urgClass = $derived(isDa && days !== null ? (days < 0 ? 'scaduta' : days <= 5 ? 'urgente' : '') : '');
  const badge = $derived.by(() => {
    if (days === null) return null;
    let text: string, color: string, bg: string;
    if (days < 0) { text = `Scaduta da ${Math.abs(days)}g`; color = '#C4622D'; bg = '#FFE0D0'; }
    else if (days === 0) { text = 'Scade oggi!'; color = '#C4622D'; bg = '#FFE0D0'; }
    else if (days <= 5) { text = `Scade tra ${days}g`; color = '#C4622D'; bg = '#FFE0D0'; }
    else if (days <= 10) { text = `Scade tra ${days}g`; color = '#A05010'; bg = '#FFF3CD'; }
    else { text = `Scade il ${strToDisplay(expense.sc)}`; color = '#6B7280'; bg = '#F3F4F6'; }
    return { text, color, bg };
  });

  async function toggle() {
    const newS = expense.s === 'da' ? 'ok' : 'da';
    const body: Record<string, unknown> = { s: newS };
    if (newS === 'ok') body.paidAt = new Date().toISOString().slice(0, 10);
    const res = await authFetch(`/api/exp/${expense._k}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) showToast('Errore aggiornamento');
  }

  async function del() {
    const res = await authFetch(`/api/exp/${expense._k}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!res.ok) showToast('Errore eliminazione');
    confirmDel = false;
  }
</script>

<div class="card {urgClass}">
  <div class="header">
    <div class="icon" style="background:{cat.bg};color:{cat.color}">{@html cat.svg}</div>
    <div class="info">
      <div class="name">{esc(expense.n)}</div>
      <div class="meta">{esc(payerText)}{expense.dt ? ' · ' + strToDisplay(expense.dt) : ''}</div>
    </div>
    <div class="amt">€{expense.a.toFixed(2)}</div>
  </div>

  {#if isDa && badge}
    <div class="badge" style="background:{badge.bg}">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={badge.color} stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span style="color:{badge.color}">{badge.text}</span>
    </div>
  {:else if !isDa && expense.sc}
    <div class="meta">Scadenza: {strToDisplay(expense.sc)}</div>
  {/if}

  <div class="actions">
    <button class={isDa ? 'btn-primary-sm' : 'btn-secondary-sm'} onclick={toggle}>{isDa ? 'Segna come pagata' : 'Annulla pagamento'}</button>
    <button class="btn-edit" onclick={() => showEdit = true}>Modifica</button>
    <button class="btn-del" onclick={() => confirmDel = true} aria-label="Elimina spesa">✕</button>
  </div>
</div>

{#if showEdit}
  <ExpenseEditModal {expense} onClose={() => showEdit = false} />
{/if}
{#if confirmDel}
  <ConfirmDialog message={'Eliminare "' + (expense.n || expense.c) + '"?'} onConfirm={del} onCancel={() => confirmDel = false} />
{/if}

<style>
  .card { background: var(--bg-card); border-radius: 14px; padding: 12px 13px; border: 1.5px solid var(--border-light); margin-bottom: 8px; }
  .card.urgente { background: var(--urgent-bg); border-color: var(--accent); border-width: 2px; }
  .card.scaduta { background: var(--scaduta-bg); border-color: var(--scaduta-border); border-width: 2px; }
  .header { display: flex; align-items: center; gap: 9px; }
  .icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .info { flex: 1; min-width: 0; }
  .name { font-size: 13px; font-weight: 700; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .meta { font-size: 10px; color: var(--text-muted); font-weight: 500; margin-top: 1px; }
  .amt { font-size: 14px; font-weight: 800; color: var(--text-primary); font-family: Georgia, serif; flex-shrink: 0; }
  .badge { display: inline-flex; align-items: center; gap: 5px; margin-top: 7px; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; }
  .actions { display: flex; gap: 8px; margin-top: 10px; }
  .btn-primary-sm, .btn-secondary-sm, .btn-edit, .btn-del { all: unset; flex: 1; height: 36px; border-radius: 9px; font-size: 13px; font-weight: 800; text-align: center; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .btn-primary-sm, .btn-edit { background: var(--accent); color: var(--color-white); }
  .btn-secondary-sm { background: var(--bg-secondary); color: var(--color-brown); }
  .btn-del { background: var(--bg-secondary); color: var(--color-brown); }
</style>
