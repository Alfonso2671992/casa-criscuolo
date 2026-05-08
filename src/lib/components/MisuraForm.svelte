<script lang="ts">
  import { showToast } from '$lib/stores';
  import { storage } from '$lib/firebase-client';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { ROOT } from '$lib/constants';

  let name = $state('');
  let dims = $state('');
  let note = $state('');
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
    if (!name.trim()) { showToast('Inserisci un nome'); return; }
    let photoUrl: string | null = null;

    if (photoFile) {
      try {
        const ext = photoFile.name.split('.').pop() || 'jpg';
        const fname = Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.' + ext;
        const path = ROOT + '/photos/mis/' + fname;
        const snapshot = await uploadBytes(ref(storage, path), photoFile);
        photoUrl = await getDownloadURL(snapshot.ref);
      } catch (e) {
        showToast('Errore caricamento foto');
        return;
      }
    }

    const res = await fetch('/api/mis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ n: name, d: dims, note, p: photoUrl }),
    });
    if (!res.ok) { showToast('Errore salvataggio'); return; }
    name = ''; dims = ''; note = ''; photoFile = null; previewUrl = null;
    showToast('Misura salvata');
  }
</script>

<div class="card">
  <input class="inp" placeholder="Nome luogo (es. Nicchia soggiorno...)" bind:value={name} />
  <input class="inp" placeholder="Misure (es. L 80 × H 120 × P 30 cm)" bind:value={dims} />
  <input class="inp" placeholder="Note" bind:value={note} />
  <button class="photo-btn" onclick={() => document.getElementById('misFileInput')?.click()}>+ Aggiungi foto</button>
  <input type="file" id="misFileInput" accept="image/*" style="display:none" onchange={handlePhoto} />
  {#if previewUrl}
    <img src={previewUrl} class="preview" alt="anteprima" />
  {/if}
  <button class="btn-primary" onclick={submit}>+ Salva misura</button>
</div>

<style>
  .card { background: #FDF6EC; border-radius: 16px; padding: 14px; margin-bottom: 14px; border: 1.5px solid #D4A574; }
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
