<script lang="ts">
  import { CATS as allCats, BOLLETTE_IDS } from '$lib/constants';
  import { names, showToast } from '$lib/stores';
  import { authFetch } from '$lib/firebase-client';
  import CategoryGrid from './CategoryGrid.svelte';
  import Calendar from './Calendar.svelte';
  import { today } from '$lib/utils';

  let name = $state('');
  let amount = $state(0);
  let cat = $state('altro');
  let payer = $state('');
  let selectedDate = $state(today());
  let selectedScad = $state<string | null>(null);
  let showScad = $derived(BOLLETTE_IDS.includes(cat));

  let payerOpts = $derived([
    { val: $names.p1, color: '#C4622D', bg: '#FDF0E6', border: '#D4A574' },
    { val: $names.p2, color: '#C2185B', bg: '#FCE4EC', border: '#F48FB1' },
    { val: 'A metà', color: '#5D4037', bg: '#EFEBE9', border: '#BCAAA4' },
  ]);

  function changeAmt(d: number) {
    amount = Math.max(0, +(amount + d).toFixed(2));
  }

  async function submit() {
    if (amount <= 0) return;
    if (!payer) { showToast('Seleziona chi paga'); return; }
    const body = {
      n: name || cat,
      a: amount,
      c: cat,
      dt: showScad ? null : selectedDate,
      sc: selectedScad,
      payer,
    };
    const res = await authFetch('/api/exp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) { showToast('Errore salvataggio'); return; }
    name = ''; amount = 0; payer = ''; cat = 'altro';
    selectedDate = today(); selectedScad = null;
    showToast('Spesa aggiunta');
  }
</script>

<div class="card">
  <input class="inp" placeholder="Nome spesa (opzionale)" bind:value={name} />
  <div class="label">Categoria</div>
  <CategoryGrid categories={allCats} bind:selected={cat} columns={4} />
  <div class="label">Importo</div>
  <div class="amt-wrap">
    <span class="euro">€</span>
    <input type="number" class="inp amt" placeholder="0.00" min="0" step="1" bind:value={amount} />
  </div>
  <div class="adj-row">
    <button class="adj adj-minus" onclick={() => changeAmt(-10)}>−10</button>
    <button class="adj adj-minus" onclick={() => changeAmt(-1)}>−1</button>
    <button class="adj adj-plus" onclick={() => changeAmt(1)}>+1</button>
    <button class="adj adj-plus" onclick={() => changeAmt(10)}>+10</button>
  </div>
  <div class="label">Chi paga?</div>
  <div class="payer-row">
    {#each payerOpts as opt}
      <button
        class="payer-btn"
        style="border-color:{payer === opt.val ? opt.color : opt.border};background:{payer === opt.val ? opt.bg : '#FAF3E8'}"
        onclick={() => payer = opt.val}
      >
        <div class="avatar" style="background:{payer === opt.val ? opt.color : opt.bg};border:2px solid {payer === opt.val ? opt.color : opt.border};color:{payer === opt.val ? '#FFF' : opt.color}">{opt.val === 'A metà' ? '½' : opt.val.charAt(0)}</div>
        <span style="color:{payer === opt.val ? opt.color : '#8B6040'}">{opt.val}</span>
      </button>
    {/each}
  </div>
  <div class="label">{showScad ? 'Scadenza' : 'Data'}</div>
  {#if showScad}
    <Calendar bind:selected={selectedScad} buttonLabel="Scadenza" />
  {:else}
    <Calendar bind:selected={selectedDate} buttonLabel={today()} />
  {/if}
  <button class="btn-primary" onclick={submit}>+ Aggiungi spesa</button>
</div>

<style>
  .card { background: #FDF6EC; border-radius: 16px; padding: 14px; margin-bottom: 14px; border: 1.5px solid #D4A574; }
  .label { font-size: 10px; font-weight: 700; color: #A07850; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 8px; }
  .inp {
    all: unset; display: block; width: 100%; padding: 10px 12px; border-radius: 10px;
    border: 1.5px solid #D4A574; background: #FAF3E8; color: #3D2010;
    font-size: 14px; font-weight: 500; margin-bottom: 10px; box-sizing: border-box;
  }
  .amt-wrap { position: relative; margin-bottom: 8px; }
  .amt { padding-left: 28px; margin-bottom: 0; }
  .euro { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 15px; font-weight: 800; color: #C4622D; pointer-events: none; z-index: 1; }
  .adj-row { display: flex; gap: 6px; margin-bottom: 12px; }
  .adj { all: unset; flex: 1; height: 36px; border-radius: 9px; font-size: 13px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .adj-minus { background: #EDD9C0; color: #8B4513; border: 1.5px solid #D4A574; }
  .adj-plus { background: #C4622D; color: #FFF; }
  .payer-row { display: flex; gap: 8px; margin-bottom: 12px; }
  .payer-btn { all: unset; flex: 1; padding: 9px 4px; border-radius: 10px; background: #FAF3E8; border: 2px solid #BCAAA4; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; box-sizing: border-box; }
  .avatar { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; }
  .payer-btn span { font-size: 9px; font-weight: 600; color: #8B6040; text-align: center; line-height: 1.2; }
  .btn-primary {
    all: unset; display: block; width: 100%; padding: 13px; border-radius: 12px;
    background: #C4622D; color: #FFF; font-size: 15px; font-weight: 700;
    text-align: center; cursor: pointer; box-sizing: border-box; margin-top: 6px;
  }
</style>
