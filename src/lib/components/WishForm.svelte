<script lang="ts">
  import { CASA_CATS } from '$lib/constants';
  import { showToast } from '$lib/stores';
  import { authFetch } from '$lib/firebase-client';
  import { compressImg } from '$lib/utils';
  import CategoryGrid from './CategoryGrid.svelte';

  let name = $state('');
  let cat = $state('Lampada');
  let dims = $state('');
  let link = $state('');
  let budgetStr = $state('');
  let previewUrl = $state<string | null>(null);
  let submitting = $state(false);

  async function handlePhoto(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { showToast('Foto troppo grande (max 5MB)'); return; }
    try {
      previewUrl = await compressImg(f);
    } catch { showToast('Errore compressione foto'); }
  }

  async function submit() {
    if (submitting) return;
    let bgt: number | null = parseFloat(budgetStr.replace(',', '.'));
    if (isNaN(bgt)) bgt = null;
    let body: Record<string, unknown> = {
      n: name || cat,
      c: cat,
      d: dims,
      l: link,
      bgt,
      p: previewUrl,
    };

    submitting = true;
    const res = await authFetch('/api/wish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    submitting = false;
    if (!res.ok) { showToast('Errore salvataggio'); return; }
    name = ''; cat = 'Lampada'; dims = ''; link = ''; budgetStr = '';
    previewUrl = null;
    showToast('Oggetto aggiunto');
  }
</script>

<div class="card">
  <input class="inp" placeholder="Nome oggetto (opzionale)" bind:value={name} />
  <div class="label">Categoria</div>
  <CategoryGrid categories={CASA_CATS} bind:selected={cat} columns={3} />
  <input class="inp" placeholder="Misure (es. 40×60 cm)" bind:value={dims} />
  <input class="inp" placeholder="Link prodotto (Amazon, IKEA...)" bind:value={link} />
  <input type="text" inputmode="decimal" class="inp" placeholder="Budget indicativo (€)" bind:value={budgetStr} />
  <button class="photo-btn" onclick={() => document.getElementById('wishFileInput')?.click()}>+ Aggiungi foto</button>
  <input type="file" id="wishFileInput" accept="image/*" style="display:none" onchange={handlePhoto} />
  {#if previewUrl}
    <img src={previewUrl} class="preview" alt="anteprima" />
  {/if}
  <button class="btn-primary" disabled={submitting} onclick={submit}>{submitting ? 'Salvataggio...' : '+ Aggiungi oggetto'}</button>
</div>

<style>
  .card { background: var(--bg-card); border-radius: 16px; padding: 14px; margin-bottom: 14px; border: 1.5px solid var(--border); }
  .label { font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .8px; margin-bottom: 8px; }
  .inp {
    all: unset; display: block; width: 100%; padding: 10px 12px; border-radius: 10px;
    border: 1.5px solid var(--border); background: var(--bg-app); color: var(--text-primary);
    font-size: 14px; font-weight: 500; margin-bottom: 10px; box-sizing: border-box;
  }
  .photo-btn {
    all: unset; display: block; width: 100%; height: 50px;
    border: 2px dashed var(--border); border-radius: 10px; background: var(--bg-app);
    color: var(--accent); font-size: 13px; font-weight: 700; text-align: center;
    cursor: pointer; box-sizing: border-box; line-height: 50px; margin-bottom: 8px;
  }
  .preview { width: 100%; height: 80px; object-fit: cover; border-radius: 10px; margin-bottom: 8px; }
  .btn-primary {
    all: unset; display: block; width: 100%; padding: 13px; border-radius: 12px;
    background: var(--accent); color: var(--color-white); font-size: 15px; font-weight: 700;
    text-align: center; cursor: pointer; box-sizing: border-box;
  }
  .btn-primary:disabled { opacity: .5; cursor: default; }
</style>
