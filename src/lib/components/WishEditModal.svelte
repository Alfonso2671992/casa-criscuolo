<script lang="ts">
  import { CASA_CATS } from '$lib/constants';
  import { showToast } from '$lib/stores';
  import { authFetch, getPhoto, isPhotoRef } from '$lib/firebase-client';
  import { compressImg, trapFocus, scrollLock } from '$lib/utils';
  import CategoryGrid from './CategoryGrid.svelte';
  import type { WishItem } from '$lib/types';

  let { wish, onClose }: { wish: WishItem; onClose: () => void } = $props();
  // svelte-ignore state_referenced_locally
  const { n: n0, c: c0, d: d0, l: l0, bgt: bgt0, _k, p: p0 } = wish;

  let name = $state(n0);
  let cat = $state(c0);
  let dims = $state(d0);
  let link = $state(l0);
  let budgetStr = $state(bgt0 != null ? bgt0.toFixed(2).replace('.', ',') : '');
  let previewUrl = $state<string | null>(null);
  let photoChanged = $state(false);
  let submitting = $state(false);

  $effect(() => {
    if (p0 && isPhotoRef(p0)) getPhoto(p0.replace('photos/', '')).then(url => { previewUrl = url; });
    else previewUrl = p0;
  });

  async function handlePhoto(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { showToast('Foto troppo grande (max 5MB)'); return; }
    try {
      previewUrl = await compressImg(f);
      photoChanged = true;
    } catch { showToast('Errore compressione foto'); }
  }

  async function submit() {
    if (submitting) return;
    let bgt: number | null = parseFloat(budgetStr.replace(',', '.'));
    if (isNaN(bgt)) bgt = null;
    submitting = true;
    const body: Record<string, unknown> = {
      n: name || cat,
      c: cat,
      d: dims,
      l: link,
      bgt,
    };
    if (photoChanged) {
      body.p = previewUrl;
    }
    const res = await authFetch(`/api/wish/${_k}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    submitting = false;
    if (!res.ok) { showToast('Errore salvataggio'); return; }
    showToast('Oggetto modificato');
    onClose();
  }
</script>

<div class="overlay" onclick={onClose} role="presentation" use:trapFocus use:scrollLock>
  <div class="box" onclick={(e) => e.stopPropagation()} onkeydown={(e) => { if (e.key === 'Escape') onClose(); }} role="dialog" tabindex="-1">
    <div class="title">Modifica oggetto</div>
    <input class="inp" placeholder="Nome oggetto (opzionale)" aria-label="Nome oggetto" bind:value={name} />
    <div class="label">Categoria</div>
    <CategoryGrid categories={CASA_CATS} bind:selected={cat} columns={3} />
    <input class="inp" placeholder="Misure (es. 40×60 cm)" aria-label="Misure" bind:value={dims} />
    <input class="inp" placeholder="Link prodotto (Amazon, IKEA...)" aria-label="Link prodotto" bind:value={link} />
    <input type="text" inputmode="decimal" class="inp" placeholder="Budget indicativo (€)" aria-label="Budget" bind:value={budgetStr} />
    <button class="photo-btn" onclick={() => document.getElementById('wishEditFileInput')?.click()}>+ Cambia foto</button>
    <input type="file" id="wishEditFileInput" accept="image/*" style="display:none" onchange={handlePhoto} />
    {#if previewUrl}
      <img src={previewUrl} class="preview" alt="anteprima" />
    {/if}
    <button class="btn-primary" disabled={submitting} onclick={submit}>{submitting ? 'Salvataggio...' : 'Salva modifiche'}</button>
    <button class="btn-cancel" onclick={onClose}>Annulla</button>
  </div>
</div>

<style>
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: 100;
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
  .photo-btn {
    all: unset; display: block; width: 100%; height: 50px;
    border: 2px dashed var(--border); border-radius: 10px; background: var(--bg-card);
    color: var(--accent); font-size: 13px; font-weight: 700; text-align: center;
    cursor: pointer; box-sizing: border-box; line-height: 50px; margin-bottom: 8px;
  }
  .preview { width: 100%; height: 80px; object-fit: cover; border-radius: 10px; margin-bottom: 8px; }
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
