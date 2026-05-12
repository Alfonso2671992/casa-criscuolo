<script lang="ts">
  import { showToast } from '$lib/stores';
  import { authFetch } from '$lib/firebase-client';

  const COLORI = [
    '#C4622D', '#2E7D32', '#1565C0', '#7B1FA2',
    '#C2185B', '#E65100', '#5D4037', '#6B7280',
  ];

  let name = $state('');
  let codice = $state('');
  let colore = $state('#C4622D');
  let note = $state('');
  let submitting = $state(false);

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
  <input class="inp" placeholder="Codice carta fedeltà" bind:value={codice} inputmode="numeric" />
  <div class="label">Colore carta</div>
  <div class="colori">
    {#each COLORI as c}
      <button class="colore" class:sel={colore === c} style="background:{c}" onclick={() => colore = c} aria-label={c}></button>
    {/each}
  </div>
  <input class="inp" placeholder="Note (opzionale)" bind:value={note} />
  <button class="btn-primary" disabled={submitting} onclick={submit}>{submitting ? 'Salvataggio...' : '+ Aggiungi carta'}</button>
</div>

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
