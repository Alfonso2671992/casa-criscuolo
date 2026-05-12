<script lang="ts">
  import { showToast } from '$lib/stores';
  import { authFetch } from '$lib/firebase-client';
  import BarcodeScanner from './BarcodeScanner.svelte';

  const COLORI = [
    '#C4622D', '#2E7D32', '#1565C0', '#7B1FA2',
    '#C2185B', '#E65100', '#5D4037', '#6B7280',
  ];

  let name = $state('');
  let codice = $state('');
  let colore = $state('#C4622D');
  let note = $state('');
  let submitting = $state(false);
  let scanning = $state(false);

  function onScan(val: string) {
    scanning = false;
    if (val) {
      codice = val;
      showToast('Codice acquisito');
    }
  }

  async function submit() {
    if (submitting) return;
    if (!name.trim()) { showToast('Inserisci il nome del negozio'); return; }
    if (!codice.trim()) { showToast('Inserisci il codice carta'); return; }
    submitting = true;
    const res = await authFetch('/api/carte', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ n: name, codice, colore, note }),
    });
    submitting = false;
    if (!res.ok) { showToast('Errore salvataggio'); return; }
    name = ''; codice = ''; colore = '#C4622D'; note = '';
    showToast('Carta salvata');
  }
</script>

<div class="card">
  <input class="inp" placeholder="Nome negozio (es. Esselunga, Conad...)" bind:value={name} />
  <div class="codice-row">
    <input class="inp codice-inp" placeholder="Codice carta fedeltà" bind:value={codice} inputmode="numeric" />
    <button class="scan-btn" onclick={() => scanning = true} aria-label="Scannerizza codice a barre">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 012-2h2M3 17v2a2 2 0 002 2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2"/><rect x="7" y="9" width="10" height="6" rx="1"/></svg>
    </button>
  </div>
  <div class="label">Colore carta</div>
  <div class="colori">
    {#each COLORI as c}
      <button class="colore" class:sel={colore === c} style="background:{c}" onclick={() => colore = c} aria-label={c}></button>
    {/each}
  </div>
  <input class="inp" placeholder="Note (opzionale)" bind:value={note} />
  <button class="btn-primary" disabled={submitting} onclick={submit}>{submitting ? 'Salvataggio...' : '+ Aggiungi carta'}</button>
</div>

{#if scanning}
  <BarcodeScanner onDetect={onScan} />
{/if}

<style>
  .card { background: var(--bg-card); border-radius: 16px; padding: 14px; margin-bottom: 14px; border: 1.5px solid var(--border); }
  .inp {
    all: unset; display: block; width: 100%; padding: 10px 12px; border-radius: 10px;
    border: 1.5px solid var(--border); background: var(--bg-app); color: var(--text-primary);
    font-size: 14px; font-weight: 500; margin-bottom: 10px; box-sizing: border-box;
  }
  .label { font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .8px; margin-bottom: 8px; }
  .colori { display: flex; gap: 8px; margin-bottom: 12px; }
  .colore { all: unset; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; border: 2.5px solid transparent; box-sizing: border-box; }
  .colore.sel { border-color: var(--text-primary); }
  .btn-primary {
    all: unset; display: block; width: 100%; padding: 13px; border-radius: 12px;
    background: var(--accent); color: var(--color-white); font-size: 15px; font-weight: 700;
    text-align: center; cursor: pointer; box-sizing: border-box;
  }
  .btn-primary:disabled { opacity: .5; cursor: default; }
</style>
