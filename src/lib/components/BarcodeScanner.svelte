<script lang="ts">
  import { onMount } from 'svelte';
  import { Html5Qrcode } from 'html5-qrcode';

  let { onDetect }: { onDetect: (value: string) => void } = $props();

  let scanner: Html5Qrcode | null = null;
  let containerId = 'barcode-scanner-' + Math.random().toString(36).slice(2, 8);

  onMount(() => {
    const el = document.getElementById(containerId);
    if (!el) return;

    scanner = new Html5Qrcode(containerId);
    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 80 } },
      (decodedText) => {
        scanner?.stop().catch(() => {});
        onDetect(decodedText);
      },
      () => {},
    ).catch(() => {
      onDetect('');
    });

    return () => {
      scanner?.stop().catch(() => {});
    };
  });
</script>

<div class="overlay" role="dialog" aria-label="Scanner codice a barre">
  <div class="scanner-wrap">
    <div id={containerId} class="reader"></div>
    <div class="hint">Inquadra il codice a barre</div>
    <button class="btn-close" onclick={() => { scanner?.stop().catch(() => {}); onDetect(''); }}>Annulla</button>
  </div>
</div>

<style>
  .overlay {
    position: fixed; inset: 0; z-index: 100;
    background: rgba(0,0,0,.85);
    display: flex; align-items: center; justify-content: center;
  }
  .scanner-wrap {
    width: 320px; max-width: 90vw; border-radius: 16px; overflow: hidden;
    background: #000; position: relative;
  }
  .reader :global(video) { width: 100%; display: block; }
  .reader :global(#qr-shaded-region) { border-radius: 10px !important; }
  .hint {
    position: absolute; bottom: 52px; left: 0; right: 0;
    text-align: center; font-size: 12px; font-weight: 600;
    color: rgba(255,255,255,.7); letter-spacing: .5px;
  }
  .btn-close {
    all: unset; display: block; width: 100%; padding: 14px;
    text-align: center; font-size: 14px; font-weight: 700;
    color: #FFF; background: #C4622D; cursor: pointer;
    box-sizing: border-box;
  }
</style>
