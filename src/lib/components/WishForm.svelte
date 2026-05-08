<script lang="ts">
  import { CASA_CATS } from '$lib/constants';
  import { showToast } from '$lib/stores';
  import CategoryGrid from './CategoryGrid.svelte';

  let name = $state('');
  let cat = $state('Lampada');
  let dims = $state('');
  let link = $state('');
  let budget = $state<number | null>(null);
  let photoFile = $state<File | null>(null);
  let previewUrl = $state<string | null>(null);

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
    let photoUrl: string | null = null;
    let body: Record<string, unknown> = {
      n: name || cat,
      c: cat,
      d: dims,
      l: link,
      bgt: budget,
      p: null,
    };

    if (photoFile) {
      body.p = previewUrl;
    }

    const res = await fetch('/api/wish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) { showToast('Errore salvataggio'); return; }
    name = ''; cat = 'Lampada'; dims = ''; link = ''; budget = null;
    photoFile = null; previewUrl = null;
    showToast('Oggetto aggiunto');
  }
</script>

<div class="card">
  <input class="inp" placeholder="Nome oggetto (opzionale)" bind:value={name} />
  <div class="label">Categoria</div>
  <CategoryGrid categories={CASA_CATS} bind:selected={cat} columns={3} />
  <input class="inp" placeholder="Misure (es. 40×60 cm)" bind:value={dims} />
  <input class="inp" placeholder="Link prodotto (Amazon, IKEA...)" bind:value={link} />
  <input type="number" class="inp" placeholder="Budget indicativo (€)" bind:value={budget} />
  <button class="photo-btn" onclick={() => document.getElementById('wishFileInput')?.click()}>+ Aggiungi foto</button>
  <input type="file" id="wishFileInput" accept="image/*" style="display:none" onchange={handlePhoto} />
  {#if previewUrl}
    <img src={previewUrl} class="preview" alt="anteprima" />
  {/if}
  <button class="btn-primary" onclick={submit}>+ Aggiungi oggetto</button>
</div>

<style>
  .card { background: #FDF6EC; border-radius: 16px; padding: 14px; margin-bottom: 14px; border: 1.5px solid #D4A574; }
  .label { font-size: 10px; font-weight: 700; color: #A07850; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 8px; }
  .inp {
    all: unset; display: block; width: 100%; padding: 10px 12px; border-radius: 10px;
    border: 1.5px solid #D4A574; background: #FAF3E8; color: #3D2010;
    font-size: 14px; font-weight: 500; margin-bottom: 10px; box-sizing: border-box;
  }
  .photo-btn {
    all: unset; display: block; width: 100%; height: 50px;
    border: 2px dashed #D4A574; border-radius: 10px; background: #FAF3E8;
    color: #C4622D; font-size: 13px; font-weight: 700; text-align: center;
    cursor: pointer; box-sizing: border-box; line-height: 50px; margin-bottom: 8px;
  }
  .preview { width: 100%; height: 80px; object-fit: cover; border-radius: 10px; margin-bottom: 8px; }
  .btn-primary {
    all: unset; display: block; width: 100%; padding: 13px; border-radius: 12px;
    background: #C4622D; color: #FFF; font-size: 15px; font-weight: 700;
    text-align: center; cursor: pointer; box-sizing: border-box;
  }
</style>
