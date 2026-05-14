<script lang="ts">
  import { showToast } from '$lib/stores';
  import { authFetch, getPhoto, isPhotoRef } from '$lib/firebase-client';
  import type { Misura } from '$lib/types';
  import { compressImg, trapFocus, scrollLock } from '$lib/utils';

  let { misura: _mis, onClose }: { misura: Misura; onClose: () => void } = $props();

  let name = $state(_mis.n);
  let l = $state(_mis.l ?? 0);
  let w = $state(_mis.w ?? 0);
  let h = $state(_mis.h ?? 0);
  let note = $state(_mis.note);
  let previewUrl = $state<string | null>(null);
  let photoChanged = $state(false);
  let submitting = $state(false);

  $effect(() => {
    if (_mis.p && isPhotoRef(_mis.p)) getPhoto(_mis.p.replace('photos/', '')).then(url => { previewUrl = url; });
    else previewUrl = _mis.p;
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
    if (!name.trim()) { showToast('Inserisci un nome'); return; }
    submitting = true;
    const body: Record<string, unknown> = {
      n: name, l: l || null, w: w || null, h: h || null, note,
    };
    if (photoChanged) {
      body.p = previewUrl;
    }
    const res = await authFetch(`/api/mis/${_mis._k}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    submitting = false;
    if (!res.ok) { showToast('Errore salvataggio'); return; }
    showToast('Misura modificata');
    onClose();
  }
</script>

<div class="overlay" onclick={onClose} role="presentation" use:trapFocus use:scrollLock>
  <div class="box" onclick={(e) => e.stopPropagation()} onkeydown={(e) => { if (e.key === 'Escape') onClose(); }} role="dialog" tabindex="-1">
    <div class="title">Modifica misura</div>
    <input class="inp" placeholder="Nome luogo (es. Nicchia soggiorno...)" aria-label="Nome luogo" bind:value={name} />
    <div class="dim-row">
      <div class="dim-group">
        <span class="dim-label">Lunghezza (cm)</span>
        <input class="inp dim-inp" type="text" inputmode="numeric" aria-label="Lunghezza" bind:value={l} />
      </div>
      <div class="dim-group">
        <span class="dim-label">Profondità (cm)</span>
        <input class="inp dim-inp" type="text" inputmode="numeric" aria-label="Profondità" bind:value={w} />
      </div>
      <div class="dim-group">
        <span class="dim-label">Altezza (cm)</span>
        <input class="inp dim-inp" type="text" inputmode="numeric" aria-label="Altezza" bind:value={h} />
      </div>
    </div>
    <input class="inp" placeholder="Note" aria-label="Note" bind:value={note} />
    <button class="photo-btn" onclick={() => document.getElementById('misEditFileInput')?.click()}>+ Cambia foto</button>
    <input type="file" id="misEditFileInput" accept="image/*" style="display:none" onchange={handlePhoto} />
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
  .inp {
    all: unset; display: block; width: 100%; padding: 10px 12px; border-radius: 10px;
    border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text-primary);
    font-size: 14px; font-weight: 500; margin-bottom: 10px; box-sizing: border-box;
  }
  .dim-row { display: flex; gap: 8px; margin-bottom: 10px; }
  .dim-group { flex: 1; display: flex; flex-direction: column; gap: 4px; }
  .dim-label { font-size: 10px; font-weight: 800; color: var(--text-muted); text-align: center; letter-spacing: .5px; }
  .dim-inp { text-align: center; font-size: 18px; font-weight: 800; margin-bottom: 0; padding: 8px 4px; }
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
