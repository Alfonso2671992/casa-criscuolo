<script lang="ts">
  import { ACQUISTO_CATS } from '$lib/constants';
  import { showToast } from '$lib/stores';
  import { authFetch } from '$lib/firebase-client';
  import CategoryGrid from './CategoryGrid.svelte';

  let name = $state('');
  let cat = $state('Spesa');
  let qta = $state('');

  async function submit() {
    if (!name.trim()) { showToast('Inserisci un nome'); return; }
    const body: Record<string, unknown> = {
      n: name.trim(),
      c: cat,
      qta,
    };
    const res = await authFetch('/api/acquisto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) { showToast('Errore salvataggio'); return; }
    name = ''; cat = 'Spesa'; qta = '';
    showToast('Aggiunto alla lista');
  }
</script>

<div class="card">
  <input class="inp" placeholder="Cosa devi comprare?" bind:value={name} />
  <div class="label">Categoria</div>
  <CategoryGrid categories={ACQUISTO_CATS} bind:selected={cat} columns={3} />
  <input class="inp" placeholder="Quantità (es. 1 kg, 2 confezioni)" bind:value={qta} />
  <button class="btn-primary" onclick={submit}>+ Aggiungi alla lista</button>
</div>

<style>
  .card { background: var(--bg-card); border-radius: 16px; padding: 14px; margin-bottom: 14px; border: 1.5px solid var(--border); }
  .label { font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .8px; margin-bottom: 8px; }
  .inp {
    all: unset; display: block; width: 100%; padding: 10px 12px; border-radius: 10px;
    border: 1.5px solid var(--border); background: var(--bg-app); color: var(--text-primary);
    font-size: 14px; font-weight: 500; margin-bottom: 10px; box-sizing: border-box;
  }
  .btn-primary {
    all: unset; display: block; width: 100%; padding: 13px; border-radius: 12px;
    background: var(--accent); color: var(--color-white); font-size: 15px; font-weight: 700;
    text-align: center; cursor: pointer; box-sizing: border-box;
  }
</style>
