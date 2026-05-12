<script lang="ts">
  import { showToast } from '$lib/stores';

  let { onDetect }: { onDetect: (value: string) => void } = $props();

  let video = $state<HTMLVideoElement | null>(null);
  let stream: MediaStream | null = null;
  let detector: BarcodeDetector | null = null;
  let scanning = $state(true);
  let supported = $state(true);
  let raf = $state(0);

  $effect(() => {
    if (!('BarcodeDetector' in window)) {
      supported = false;
      showToast('Scanner non supportato su questo browser');
      return;
    }

    const formats = ['ean_13', 'ean_8', 'code_128', 'code_39', 'code_93', 'upc_a', 'upc_e', 'itf', 'qr_code'];
    BarcodeDetector.getSupportedFormats().then((supportedFormats) => {
      const available = formats.filter(f => supportedFormats.includes(f));
      detector = new BarcodeDetector({ formats: available.length > 0 ? available : undefined });
    }).catch(() => {
      detector = new BarcodeDetector();
    });

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
    }).then((s) => {
      stream = s;
      if (video) video.srcObject = s;
    }).catch(() => {
      showToast('Impossibile aprire la fotocamera');
      supported = false;
    });

    return () => {
      cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  });

  let frameCount = 0;
  function tick() {
    const v = video;
    const d = detector;
    if (!v || !d || !scanning) return;
    frameCount++;
    if (frameCount % 3 !== 0) { raf = requestAnimationFrame(tick); return; }
    if (v.readyState !== HTMLMediaElement.HAVE_ENOUGH_DATA) { raf = requestAnimationFrame(tick); return; }
    d.detect(v).then((barcodes: DetectedBarcode[]) => {
      if (barcodes.length > 0 && scanning) {
        scanning = false;
        const val = barcodes[0].rawValue;
        if (stream) stream.getTracks().forEach(t => t.stop());
        cancelAnimationFrame(raf);
        onDetect(val);
      }
    }).catch(() => {});
    raf = requestAnimationFrame(tick);
  }

  $effect(() => {
    const v = video;
    if (v && supported) {
      v.onloadedmetadata = () => {
        v.play();
        raf = requestAnimationFrame(tick);
      };
    }
  });

  function close() {
    scanning = false;
    cancelAnimationFrame(raf);
    if (stream) stream.getTracks().forEach(t => t.stop());
    onDetect('');
  }
</script>

<div class="overlay" role="dialog" aria-label="Scanner codice a barre">
  <div class="scanner-wrap">
    {#if !supported}
      <div class="unsupported">
        <p>Scanner non supportato</p>
        <p class="sub">Usa Chrome o Edge su HTTPS</p>
        <button class="btn-close" onclick={close}>Chiudi</button>
      </div>
    {:else}
      <video bind:this={video} class="video" autoplay playsinline muted></video>
      <div class="viewfinder">
        <div class="scan-line"></div>
      </div>
      <div class="hint">Inquadra il codice a barre</div>
      <button class="btn-close" onclick={close}>Annulla</button>
    {/if}
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
  .video { width: 100%; display: block; }
  .viewfinder {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 220px; height: 80px;
    border: 2.5px solid rgba(255,255,255,.7);
    border-radius: 10px;
  }
  .scan-line {
    position: absolute; left: 4px; right: 4px; height: 2px;
    background: #C4622D; top: 50%;
    animation: scan 2s ease-in-out infinite;
  }
  @keyframes scan {
    0%, 100% { top: 8px; }
    50% { top: calc(100% - 8px); }
  }
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
  .unsupported { padding: 40px 20px; text-align: center; color: #FFF; }
  .unsupported p { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
  .unsupported .sub { font-size: 12px; font-weight: 400; color: rgba(255,255,255,.6); margin-bottom: 20px; }
</style>
