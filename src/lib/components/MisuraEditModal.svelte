<script lang="ts">
  import { showToast } from '$lib/stores';
  import { authFetch } from '$lib/firebase-client';
  import type { Misura } from '$lib/types';

  let { misura, onClose }: { misura: Misura; onClose: () => void } = $props();

  let name = $state(misura.n);
  let l = $state(misura.l != null ? String(misura.l) : '');
  let w = $state(misura.w != null ? String(misura.w) : '');
  let h = $state(misura.h != null ? String(misura.h) : '');
  let unit = $state(misura.unit || 'cm');
  let note = $state(misura.note);
  let photoFile = $state<File | null>(null);
  let previewUrl = $state<string | null>(misura.p);
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

  function pn(v: string): number | null {
    const n = parseFloat(v.replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  async function submit() {
    if (submitting) return;
    if (!name.trim()) { showToast('Inserisci un nome'); return; }
    submitting = true;
    const body: Record<string, unknown> = {
      n: name, l: pn(l), w: pn(w), h: pn(h), unit, note,
    };
    if (photoFile || previewUrl !== misura.p) {
      body.p = previewUrl;
    }
    const res = await authFetch(`/api/mis/${misura._k}`, {
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

<div class="overlay" onclick={onClose} role="presentation">
  <div class="box" onclick={(e) => e.stopPropagation()} onkeydown={(e) => { if (e.key === 'Escape') onClose(); }} role="dialog" tabindex="-1">
    <div class="title">Modifica misura</div>
    <input class="inp" placeholder="Nome luogo (es. Nicchia soggiorno...)" bind:value={name} />
    <div class="dim-row">
      <div class="dim-group">
        <span class="dim-label">L</span>
        <input class="inp dim-inp" type="text" inputmode="decimal" placeholder="0" bind:value={l} />
      </div>
      <div class="dim-group">
        <span class="dim-label">W</span>
        <input class="inp dim-inp" type="text" inputmode="decimal" placeholder="0" bind:value={w} />
      </div>
      <div class="dim-group">
        <span class="dim-label">H</span>
        <input class="inp dim-inp" type="text" inputmode="decimal" placeholder="0" bind:value={h} />
      </div>
      <select class="unit-sel" bind:value={unit}>
        <option value="cm">cm</option>
        <option value="m">m</option>
        <option value="mm">mm</option>
      </select>
    </div>
    <input class="inp" placeholder="Note" bind:value={note} />
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
  .dim-row { display: flex; gap: 6px; margin-bottom: 10px; align-items: flex-start; }
  .dim-group { flex: 1; display: flex; flex-direction: column; gap: 3px; }
  .dim-label { font-size: 10px; font-weight: 800; color: var(--text-muted); text-align: center; letter-spacing: .5px; }
  .dim-inp { margin-bottom: 0; text-align: center; }
  .unit-sel {
    all: unset; width: 52px; padding: 10px 4px; border-radius: 10px;
    border: 1.5px solid var(--border); background: var(--bg-card); color: var(--text-primary);
    font-size: 13px; font-weight: 700; text-align: center; cursor: pointer; box-sizing: border-box; flex-shrink: 0;
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
