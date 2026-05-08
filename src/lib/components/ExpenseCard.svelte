<script lang="ts">
  import { CATS } from '$lib/constants';
  import { strToDisplay, daysUntil, esc } from '$lib/utils';
  import { showToast } from '$lib/stores';
  import { authFetch } from '$lib/firebase-client';
  import type { Expense } from '$lib/types';

  let { expense, isDa = false }: { expense: Expense; isDa?: boolean } = $props();

  const cat = $derived(CATS.find(c => c.id === expense.c) || CATS[7]);
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
    const res = await authFetch(`/api/exp/${expense._k}`, { method: 'DELETE' });
    if (!res.ok) showToast('Errore eliminazione');
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
    <button class="btn-del" onclick={del}>✕</button>
  </div>
</div>

<style>
  .card { background: #FDF6EC; border-radius: 14px; padding: 12px 13px; border: 1.5px solid #EDD9C0; margin-bottom: 8px; }
  .card.urgente { background: #FFE0D0; border-color: #C4622D; border-width: 2px; }
  .card.scaduta { background: #FFCFBA; border-color: #B03000; border-width: 2px; }
  .header { display: flex; align-items: center; gap: 9px; }
  .icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .info { flex: 1; min-width: 0; }
  .name { font-size: 13px; font-weight: 700; color: #3D2010; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .meta { font-size: 10px; color: #A07850; font-weight: 500; margin-top: 1px; }
  .amt { font-size: 14px; font-weight: 800; color: #3D2010; font-family: Georgia, serif; flex-shrink: 0; }
  .badge { display: inline-flex; align-items: center; gap: 5px; margin-top: 7px; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; }
  .actions { display: flex; gap: 6px; margin-top: 9px; }
  .btn-primary-sm, .btn-secondary-sm { all: unset; flex: 1; padding: 7px 0; border-radius: 9px; font-size: 11px; font-weight: 700; text-align: center; cursor: pointer; display: block; }
  .btn-primary-sm { background: #C4622D; color: #FFF; }
  .btn-secondary-sm { background: #EDD9C0; color: #8B4513; }
  .btn-del { all: unset; padding: 7px 12px; border-radius: 9px; background: #EDD9C0; color: #8B4513; font-size: 11px; font-weight: 700; cursor: pointer; display: inline-block; }
</style>
