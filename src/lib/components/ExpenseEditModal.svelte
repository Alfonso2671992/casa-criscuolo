<script lang="ts">
  import { CATS as allCats, BOLLETTE_IDS } from '$lib/constants';
  import { names, showToast } from '$lib/stores';
  import { authFetch } from '$lib/firebase-client';
  import CategoryGrid from './CategoryGrid.svelte';
  import Calendar from './Calendar.svelte';
  import { today, trapFocus, scrollLock } from '$lib/utils';
  import type { Expense } from '$lib/types';

  let { expense, onClose }: { expense: Expense; onClose: () => void } = $props();
  // svelte-ignore state_referenced_locally
  const { n: n0, a: a0, c: c0, payer: p0, dt: dt0, sc: sc0, _k } = expense;

  let name = $state(n0);
  let amountStr = $state(a0.toFixed(2).replace('.', ','));
  let cat = $state(c0);
  let payer = $state(p0);
  let selectedDate = $state(dt0 ?? today());
  let selectedScad = $state<string | null>(sc0);
  let showScad = $derived(BOLLETTE_IDS.includes(cat));
  let submitting = $state(false);

  let payerOpts = $derived([
    { val: $names.p1, color: '#C4622D', bg: '#FDF0E6', border: '#D4A574' },
    { val: $names.p2, color: '#C2185B', bg: '#FCE4EC', border: '#F48FB1' },
    { val: 'A metà', color: '#5D4037', bg: '#EFEBE9', border: '#BCAAA4' },
  ]);

  function parseAmt(v: string): number {
    const n = parseFloat(v.replace(',', '.'));
    return isNaN(n) ? 0 : Math.max(0, +n.toFixed(2));
  }

  function changeAmt(d: number) {
    const cur = parseAmt(amountStr);
    amountStr = (Math.max(0, +(cur + d).toFixed(2))).toFixed(2);
  }

  function onAmtInput(e: Event) {
    amountStr = (e.target as HTMLInputElement).value;
  }

  async function submit() {
    if (submitting) return;
    const amt = parseAmt(amountStr);
    if (amt <= 0) { showToast('Importo non valido'); return; }
    if (!payer) { showToast('Seleziona chi paga'); return; }
    submitting = true;
    const body: Record<string, unknown> = {
      n: name || cat,
      a: amt,
      c: cat,
      dt: showScad ? null : selectedDate,
      sc: selectedScad,
      payer,
    };
    const res = await authFetch(`/api/exp/${_k}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    submitting = false;
    if (!res.ok) { showToast('Errore salvataggio'); return; }
    showToast('Spesa modificata');
    onClose();
  }
</script>

<div class="overlay" onclick={onClose} role="presentation" use:trapFocus use:scrollLock>
  <div class="box" onclick={(e) => e.stopPropagation()} onkeydown={(e) => { if (e.key === 'Escape') onClose(); }} role="dialog" tabindex="-1">
    <div class="title">Modifica spesa</div>
    <input class="inp" placeholder="Nome spesa (opzionale)" aria-label="Nome spesa" bind:value={name} />
    <div class="label">Categoria</div>
    <CategoryGrid categories={allCats} bind:selected={cat} columns={4} />
    <div class="label">Importo</div>
    <div class="amt-wrap">
      <span class="euro" aria-hidden="true">€</span>
      <input type="text" inputmode="decimal" class="inp amt" placeholder="0,00" aria-label="Importo" value={amountStr} oninput={onAmtInput} />
    </div>
    <div class="adj-row">
      <button class="adj adj-minus" onclick={() => changeAmt(-10)} aria-label="Riduci di 10">−10</button>
      <button class="adj adj-minus" onclick={() => changeAmt(-1)} aria-label="Riduci di 1">−1</button>
      <button class="adj adj-plus" onclick={() => changeAmt(1)} aria-label="Aumenta di 1">+1</button>
      <button class="adj adj-plus" onclick={() => changeAmt(10)} aria-label="Aumenta di 10">+10</button>
    </div>
    <div class="label">Chi paga?</div>
    <div class="payer-row">
      {#each payerOpts as opt}
        <button
          class="payer-btn"
          class:selected={payer === opt.val}
          style="border-color:{payer === opt.val ? opt.color : opt.border};background:{payer === opt.val ? opt.bg : 'var(--bg-card)'}"
          onclick={() => payer = opt.val}
        >
          <div class="avatar" style="background:{payer === opt.val ? opt.color : opt.bg};border:2px solid {payer === opt.val ? opt.color : opt.border};color:{payer === opt.val ? 'var(--color-white)' : opt.color}">{opt.val === 'A metà' ? '½' : opt.val.charAt(0)}</div>
          <span style="color:{payer === opt.val ? opt.color : 'var(--text-secondary)'}">{opt.val}</span>
        </button>
      {/each}
    </div>
    <div class="label">{showScad ? 'Scadenza' : 'Data'}</div>
    {#if showScad}
      <Calendar bind:selected={selectedScad} buttonLabel="Scadenza" />
    {:else}
      <Calendar bind:selected={selectedDate} buttonLabel={today()} />
    {/if}
    <button class="btn-primary" disabled={submitting} onclick={submit}>{submitting ? 'Salvataggio...' : 'Salva modifiche'}</button>
    <button class="btn-cancel" onclick={onClose}>Annulla</button>
  </div>
</div>

<style>
  .overlay {
    position: fixed; inset: 0; background: var(--overlay-bg); z-index: 100;
    display: flex; align-items: center; justify-content: center;
    padding: calc(env(safe-area-inset-top) + 110px) 0 50px;
  }
  .box {
    background: var(--bg-card); border-radius: 18px; padding: 22px;
    width: 380px; max-width: 92vw; max-height: 90vh; overflow-y: auto;
  }
  .title { font-size: 16px; font-weight: 800; color: var(--text-primary); margin-bottom: 14px; text-align: center; }
  .label { font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .8px; margin-bottom: 8px; }
  .inp {
    all: unset; display: block; width: 100%; padding: 10px 12px; border-radius: 10px;
    border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text-primary);
    font-size: 14px; font-weight: 500; margin-bottom: 10px; box-sizing: border-box;
  }
  .amt-wrap { position: relative; margin-bottom: 8px; }
  .amt { padding-left: 28px; margin-bottom: 0; }
  .euro { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 15px; font-weight: 800; color: var(--accent); pointer-events: none; z-index: 1; }
  .adj-row { display: flex; gap: 6px; margin-bottom: 12px; }
  .adj { all: unset; flex: 1; height: 36px; border-radius: 9px; font-size: 13px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .adj-minus { background: var(--bg-secondary); color: var(--color-brown); border: 1.5px solid var(--border); }
  .adj-plus { background: var(--accent); color: var(--color-white); }
  .payer-row { display: flex; gap: 8px; margin-bottom: 12px; }
  .payer-btn { all: unset; flex: 1; padding: 9px 4px; border-radius: 10px; background: var(--bg-card); border: 2px solid var(--primary-border); cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; box-sizing: border-box; }
  .avatar { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; }
  .payer-btn span { font-size: 10px; font-weight: 600; color: var(--text-secondary); text-align: center; line-height: 1.2; }
  .btn-primary {
    all: unset; display: block; width: 100%; padding: 13px; border-radius: 12px;
    background: var(--accent); color: var(--color-white); font-size: 15px; font-weight: 700;
    text-align: center; cursor: pointer; box-sizing: border-box; margin-top: 6px;
  }
  .btn-primary:disabled { opacity: .5; cursor: default; }
  .btn-cancel {
    all: unset; display: block; width: 100%; padding: 11px; border-radius: 12px;
    background: transparent; color: var(--text-muted); font-size: 14px; font-weight: 700;
    text-align: center; cursor: pointer; box-sizing: border-box; margin-top: 6px;
  }
</style>
