<script lang="ts">
  import { CASA_CATS } from '$lib/constants';
  import { showToast } from '$lib/stores';
  import { authFetch } from '$lib/firebase-client';
  import CategoryGrid from './CategoryGrid.svelte';
  import type { WishItem } from '$lib/types';

  let { wish, onClose }: { wish: WishItem; onClose: () => void } = $props();

  let name = $state(wish.n);
  let cat = $state(wish.c);
  let dims = $state(wish.d);
  let link = $state(wish.l);
  let budgetStr = $state(wish.bgt != null ? wish.bgt.toFixed(2).replace('.', ',') : '');
  let photoFile = $state<File | null>(null);
  let previewUrl = $state<string | null>(wish.p);
  let submitting = $state(false);

  function handlePhoto(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { showToast('Foto troppo grande (max 5MB)'); return; }
    photoFile = f;
    const r = new FileReader();
    r.onload = () => { previewUrl = r.result as string; };
    r.readAsDataURL(f);
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
    if (photoFile || previewUrl !== wish.p) {
      body.p = previewUrl;
    }
    const res = await authFetch(`/api/wish/${wish._k}`, {
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

<div class="overlay" onclick={onClose} role="presentation">
  <div class="box" onclick={(e) => e.stopPropagation()} onkeydown={(e) => { if (e.key === 'Escape') onClose(); }} role="dialog" tabindex="-1">
    <div class="title">Modifica oggetto</div>
    <input class="inp" placeholder="Nome oggetto (opzionale)" bind:value={name} />
    <div class="label">Categoria</div>
    <CategoryGrid categories={CASA_CATS} bind:selected={cat} columns={3} />
    <input class="inp" placeholder="Misure (es. 40×60 cm)" bind:value={dims} />
    <input class="inp" placeholder="Link prodotto (Amazon, IKEA...)" bind:value={link} />
    <input type="text" inputmode="decimal" class="inp" placeholder="Budget indicativo (€)" bind:value={budgetStr} />
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
