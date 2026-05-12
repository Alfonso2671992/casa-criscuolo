<script lang="ts">
  import { onMount } from 'svelte';
  import Quagga from '@ericblade/quagga2';

  let { onDetect }: { onDetect: (value: string) => void } = $props();

  let containerEl = $state<HTMLDivElement | null>(null);

  onMount(() => {
    if (!containerEl) return;

    Quagga.init({
      inputStream: {
        type: 'LiveStream',
        target: containerEl,
        constraints: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'environment',
        },
      },
      decoder: {
        readers: [
          'ean_reader', 'ean_8_reader', 'code_128_reader', 'code_39_reader',
          'code_39_vin_reader', 'codabar_reader', 'upc_reader', 'upc_e_reader',
          'i2of5_reader', '2of5_reader', 'code_93_reader',
        ],
      },
      locate: true,
    }, (err: unknown) => {
      if (err) { onDetect(''); return; }
      Quagga.start();
    });

    Quagga.onDetected((data: unknown) => {
      const d = data as { codeResult?: { code?: string } };
      const code = d.codeResult?.code;
      if (code) {
        Quagga.stop();
        onDetect(code);
      }
    });

    return () => {
      try { Quagga.stop(); } catch {}
    };
  });
</script>

<div class="overlay" role="dialog" aria-label="Scanner codice a barre">
  <div class="scanner-wrap">
    <div bind:this={containerEl} class="reader"></div>
    <div class="viewfinder">
      <div class="scan-line"></div>
    </div>
    <div class="hint">Inquadra il codice a barre</div>
    <button class="btn-close" onclick={() => { try { Quagga.stop(); } catch {} onDetect(''); }}>Annulla</button>
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
  .reader { width: 100%; min-height: 240px; }
  .reader :global(video), .reader :global(canvas) { width: 100% !important; display: block; }
  .viewfinder {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 240px; height: 80px;
    border: 2.5px solid rgba(255,255,255,.6);
    border-radius: 10px;
    pointer-events: none;
  }
  .scan-line {
    position: absolute; left: 4px; right: 4px; height: 2px;
    background: #C4622D; top: 50%;
    animation: scan 2s ease-in-out infinite;
  }
  @keyframes scan {
    0%, 100% { top: 6px; }
    50% { top: calc(100% - 6px); }
  }
  .hint {
    position: absolute; bottom: 52px; left: 0; right: 0;
    text-align: center; font-size: 12px; font-weight: 600;
    color: rgba(255,255,255,.7); letter-spacing: .5px;
    pointer-events: none;
  }
  .btn-close {
    all: unset; display: block; width: 100%; padding: 14px;
    text-align: center; font-size: 14px; font-weight: 700;
    color: #FFF; background: #C4622D; cursor: pointer;
    box-sizing: border-box;
  }
</style>
