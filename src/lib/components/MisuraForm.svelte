<script lang="ts">
  import { showToast } from '$lib/stores';
  import { authFetch } from '$lib/firebase-client';
  import { compressImg } from '$lib/utils';

  let name = $state('');
  let l = $state(0);
  let w = $state(0);
  let h = $state(0);
  let note = $state('');
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

  function pn(v: number): number | null {
    return v > 0 ? v : null;
  }

  async function submit() {
    if (submitting) return;
    if (!name.trim()) { showToast('Inserisci un nome'); return; }
    submitting = true;
    const res = await authFetch('/api/mis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ n: name, l: pn(l), w: pn(w), h: pn(h), note, p: previewUrl }),
    });
    submitting = false;
    if (!res.ok) { showToast('Errore salvataggio'); return; }
    name = ''; l = 0; w = 0; h = 0; note = ''; previewUrl = null;
    showToast('Misura salvata');
  }
</script>

<div class="card">
  <input class="inp" placeholder="Nome luogo (es. Nicchia soggiorno...)" aria-label="Nome luogo" bind:value={name} />
  <div class="dim-row">
    <div class="dim-group">
      <span class="dim-label">Lunghezza (cm)</span>
      <input class="inp dim-inp" type="number" min="0" step="any" aria-label="Lunghezza" bind:value={l} />
    </div>
    <div class="dim-group">
      <span class="dim-label">Profondità (cm)</span>
      <input class="inp dim-inp" type="number" min="0" step="any" aria-label="Profondità" bind:value={w} />
    </div>
    <div class="dim-group">
      <span class="dim-label">Altezza (cm)</span>
      <input class="inp dim-inp" type="number" min="0" step="any" aria-label="Altezza" bind:value={h} />
    </div>
  </div>
  <input class="inp" placeholder="Note" aria-label="Note" bind:value={note} />
  <button class="photo-btn" onclick={() => document.getElementById('misFileInput')?.click()}>+ Aggiungi foto</button>
  <input type="file" id="misFileInput" accept="image/*" style="display:none" onchange={handlePhoto} />
  {#if previewUrl}
    <img src={previewUrl} class="preview" alt="anteprima" />
  {/if}
  <button class="btn-primary" disabled={submitting} onclick={submit}>{submitting ? 'Salvataggio...' : '+ Salva misura'}</button>
</div>

<style>
  .card { background: var(--bg-card); border-radius: 16px; padding: 14px; margin-bottom: 14px; border: 1.5px solid var(--border); }
  .inp {
    all: unset; display: block; width: 100%; padding: 10px 12px; border-radius: 10px;
    border: 1.5px solid var(--border); background: var(--bg-app); color: var(--text-primary);
    font-size: 14px; font-weight: 500; margin-bottom: 10px; box-sizing: border-box;
  }
  .dim-row { display: flex; gap: 8px; margin-bottom: 10px; }
  .dim-group { flex: 1; display: flex; flex-direction: column; gap: 4px; }
  .dim-label { font-size: 10px; font-weight: 800; color: var(--text-muted); text-align: center; letter-spacing: .5px; }
  .dim-inp { text-align: center; font-size: 18px; font-weight: 800; margin-bottom: 0; padding: 8px 4px; }
  .dim-inp::-webkit-inner-spin-button, .dim-inp::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  .dim-inp[type=number] { -moz-appearance: textfield; }
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
