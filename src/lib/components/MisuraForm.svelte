<script lang="ts">
  import { showToast } from '$lib/stores';
  import { authFetch } from '$lib/firebase-client';

  let name = $state('');
  let l = $state(0);
  let w = $state(0);
  let h = $state(0);
  let note = $state('');
  let photoFile = $state<File | null>(null);
  let previewUrl = $state<string | null>(null);
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

  function adj(v: number, d: number) { return Math.max(0, v + d); }

  async function submit() {
    if (submitting) return;
    if (!name.trim()) { showToast('Inserisci un nome'); return; }
    let photoUrl: string | null = null;
    if (photoFile) photoUrl = previewUrl;
    submitting = true;
    const res = await authFetch('/api/mis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ n: name, l: l || null, w: w || null, h: h || null, note, p: photoUrl }),
    });
    submitting = false;
    if (!res.ok) { showToast('Errore salvataggio'); return; }
    name = ''; l = 0; w = 0; h = 0; note = ''; photoFile = null; previewUrl = null;
    showToast('Misura salvata');
  }
</script>

<div class="card">
  <input class="inp" placeholder="Nome luogo (es. Nicchia soggiorno...)" bind:value={name} />
  <div class="dim-row">
    <div class="dim-group">
      <span class="dim-label">L (cm)</span>
      <div class="dims">
        <button class="adj" onclick={() => l = adj(l, -10)} aria-label="-10">−10</button>
        <button class="adj" onclick={() => l = adj(l, -1)} aria-label="-1">−1</button>
        <span class="val">{l}</span>
        <button class="adj" onclick={() => l = adj(l, 1)} aria-label="+1">+1</button>
        <button class="adj" onclick={() => l = adj(l, 10)} aria-label="+10">+10</button>
      </div>
    </div>
    <div class="dim-group">
      <span class="dim-label">P (cm)</span>
      <div class="dims">
        <button class="adj" onclick={() => w = adj(w, -10)} aria-label="-10">−10</button>
        <button class="adj" onclick={() => w = adj(w, -1)} aria-label="-1">−1</button>
        <span class="val">{w}</span>
        <button class="adj" onclick={() => w = adj(w, 1)} aria-label="+1">+1</button>
        <button class="adj" onclick={() => w = adj(w, 10)} aria-label="+10">+10</button>
      </div>
    </div>
    <div class="dim-group">
      <span class="dim-label">A (cm)</span>
      <div class="dims">
        <button class="adj" onclick={() => h = adj(h, -10)} aria-label="-10">−10</button>
        <button class="adj" onclick={() => h = adj(h, -1)} aria-label="-1">−1</button>
        <span class="val">{h}</span>
        <button class="adj" onclick={() => h = adj(h, 1)} aria-label="+1">+1</button>
        <button class="adj" onclick={() => h = adj(h, 10)} aria-label="+10">+10</button>
      </div>
    </div>
  </div>
  <input class="inp" placeholder="Note" bind:value={note} />
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
  .dim-row { display: flex; gap: 6px; margin-bottom: 10px; }
  .dim-group { flex: 1; display: flex; flex-direction: column; gap: 4px; }
  .dim-label { font-size: 9px; font-weight: 800; color: var(--text-muted); text-align: center; letter-spacing: .5px; }
  .dims { display: flex; align-items: center; justify-content: center; gap: 2px; }
  .adj {
    all: unset; width: 22px; height: 22px; border-radius: 5px;
    background: var(--bg-secondary); color: var(--color-brown);
    font-size: 10px; font-weight: 800; cursor: pointer; text-align: center; line-height: 22px; flex-shrink: 0;
  }
  .adj:active { opacity: .6; }
  .val {
    min-width: 28px; text-align: center; font-size: 16px; font-weight: 800;
    color: var(--text-primary);
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
