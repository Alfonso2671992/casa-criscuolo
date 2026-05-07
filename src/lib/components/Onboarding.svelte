<script lang="ts">
  let n1 = $state('');
  let n2 = $state('');

  let { onComplete }: { onComplete: (n1: string, n2: string) => void } = $props();

  function submit() {
    onComplete(n1.trim() || 'Alfonso', n2.trim() || 'Alina');
  }
</script>

<div class="onboarding">
  <div class="icon-wrap">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
  </div>
  <div>
    <div class="title">Casa Criscuolo<br /><span class="accent">/ Falabella</span></div>
    <div class="subtitle">Inserite i vostri nomi per iniziare</div>
  </div>
  <div class="inputs">
    <div>
      <div class="field-label">Persona 1</div>
      <input class="inp" placeholder="Es. Alfonso" bind:value={n1} />
    </div>
    <div>
      <div class="field-label">Persona 2</div>
      <input class="inp" placeholder="Es. Alina" bind:value={n2} />
    </div>
  </div>
  <button class="btn-primary" onclick={submit}>Iniziamo →</button>
</div>

<style>
  .onboarding {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 20px; padding: 40px 28px;
    background: #FAF3E8;
  }
  .icon-wrap {
    width: 64px; height: 64px; border-radius: 18px;
    background: #C4622D; display: flex; align-items: center; justify-content: center;
  }
  .title { font-size: 24px; font-weight: 700; color: #3D2010; font-family: Georgia, serif; text-align: center; line-height: 1.3; }
  .accent { color: #C4622D; }
  .subtitle { font-size: 14px; color: #8B6040; font-weight: 500; text-align: center; margin-top: 6px; }
  .inputs { width: 100%; display: flex; flex-direction: column; gap: 10px; }
  .field-label { font-size: 11px; font-weight: 700; color: #C4622D; margin-bottom: 5px; text-transform: uppercase; letter-spacing: .8px; }
  .inp {
    all: unset; display: block; width: 100%; padding: 10px 12px; border-radius: 10px;
    border: 1.5px solid #D4A574; background: #FAF3E8; color: #3D2010;
    font-size: 14px; font-weight: 500; margin-bottom: 0; box-sizing: border-box;
  }
  .btn-primary {
    all: unset; display: block; width: 100%; padding: 13px; border-radius: 12px;
    background: #C4622D; color: #FFF; font-size: 15px; font-weight: 700;
    text-align: center; cursor: pointer; box-sizing: border-box;
  }
</style>
