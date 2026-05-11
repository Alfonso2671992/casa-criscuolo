<script lang="ts">
  import { ACQUISTO_CATS } from '$lib/constants';
  import { acquisti, showToast } from '$lib/stores';
  import { authFetch } from '$lib/firebase-client';
  import CategoryGrid from './CategoryGrid.svelte';
  import { DEFAULT_SUGGESTIONS } from '$lib/acquisto-suggestions';
  let name = $state('');
  let cat = $state('Spesa');
  let qta = $state('');
  let showSuggestions = $state(false);
  let submitting = $state(false);

  let suggestions = $derived.by(() => {
    const q = name.toLowerCase().trim();
    if (q.length < 2) return [];
    const seen = new Set<string>();
    const result: { n: string; c: string }[] = [];
    const userMap = new Map<string, string>();
    for (const item of $acquisti) {
      userMap.set(item.n.toLowerCase(), item.c);
    }
    for (const s of [...DEFAULT_SUGGESTIONS, ...$acquisti.map(i => ({ n: i.n, c: i.c }))]) {
      const ln = s.n.toLowerCase();
      if ((ln.startsWith(q) || ln.includes(q)) && !seen.has(ln)) {
        seen.add(ln);
        result.push({ n: s.n, c: userMap.get(ln) || s.c });
        if (result.length >= 8) break;
      }
    }
    return result;
  });

  function pickSuggestion(s: { n: string; c: string }) {
    name = s.n;
    cat = s.c;
    showSuggestions = false;
  }

  function onBlur() {
    setTimeout(() => showSuggestions = false, 200);
  }

  function onFocus() {
    if (suggestions.length > 0) showSuggestions = true;
  }

  async function submit() {
    if (submitting) return;
    if (!name.trim()) { showToast('Inserisci un nome'); return; }
    submitting = true;
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
    submitting = false;
    if (!res.ok) { showToast('Errore salvataggio'); return; }
    name = ''; cat = 'Spesa'; qta = '';
    showToast('Aggiunto alla lista');
  }
</script>

<div class="card">
  <div class="field">
    <input class="inp" placeholder="Cosa devi comprare?" bind:value={name} onfocus={onFocus} onblur={onBlur} oninput={() => { if (suggestions.length > 0) showSuggestions = true; }} />
    {#if showSuggestions && suggestions.length > 0}
      <div class="suggestions" role="listbox">
        {#each suggestions as s (s.n)}
          <button class="suggestion" role="option" tabindex="-1" onclick={() => pickSuggestion(s)}>
            <span class="sug-name">{s.n}</span>
            <span class="sug-cat">{ACQUISTO_CATS.find(c => c.id === s.c)?.label || s.c}</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>
  <div class="label">Categoria</div>
  <CategoryGrid categories={ACQUISTO_CATS} bind:selected={cat} columns={3} />
  <input class="inp" placeholder="Quantità (es. 1 kg, 2 confezioni)" bind:value={qta} />
  <button class="btn-primary" disabled={submitting} onclick={submit}>{submitting ? 'Salvataggio...' : '+ Aggiungi alla lista'}</button>
</div>

<style>
  .field { position: relative; margin-bottom: 10px; }
  .field .inp { margin-bottom: 0; }
  .card { background: var(--bg-card); border-radius: 16px; padding: 14px; margin-bottom: 14px; border: 1.5px solid var(--border); }
  .label { font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .8px; margin-bottom: 8px; }
  .inp {
    all: unset; display: block; width: 100%; padding: 10px 12px; border-radius: 10px;
    border: 1.5px solid var(--border); background: var(--bg-app); color: var(--text-primary);
    font-size: 14px; font-weight: 500; box-sizing: border-box;
  }
  .card .inp:last-of-type { margin-bottom: 12px; }
  .suggestions {
    position: absolute; top: 100%; left: 0; right: 0; z-index: 50;
    background: var(--bg-card); border: 1.5px solid var(--border);
    border-radius: 10px; margin-top: 4px; overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,.15);
  }
  .suggestion {
    all: unset; display: flex; align-items: center; justify-content: space-between;
    width: 100%; padding: 10px 12px; box-sizing: border-box; cursor: pointer;
    font-size: 13px; font-weight: 500; color: var(--text-primary);
    transition: background .1s;
  }
  .suggestion:hover, .suggestion:focus { background: var(--bg-secondary); }
  .sug-name { font-weight: 600; }
  .sug-cat { font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .5px; }
  .btn-primary {
    all: unset; display: block; width: 100%; padding: 13px; border-radius: 12px;
    background: var(--accent); color: var(--color-white); font-size: 15px; font-weight: 700;
    text-align: center; cursor: pointer; box-sizing: border-box;
  }
  .btn-primary:disabled { opacity: .5; cursor: default; }
</style>
