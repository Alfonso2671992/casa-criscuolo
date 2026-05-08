<script lang="ts">
  import { totalUnpaid, totalPaid } from '$lib/stores';
</script>

<div class="grid">
  <div class="card da">
    <div class="label">Da pagare</div>
    <div class="val">€ {$totalUnpaid.toFixed(2)}</div>
  </div>
  <div class="card ok">
    <div class="label">Pagate</div>
    <div class="val">€ {$totalPaid.toFixed(2)}</div>
  </div>
</div>

<style>
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
  .card { border-radius: 14px; padding: 12px 14px; }
  .da { background: var(--warning-bg); border: 1.5px solid var(--warning-border); }
  .ok { background: var(--paid-bg); border: 1.5px solid var(--paid-border); }
  .label { font-size: 10px; font-weight: 800; margin-bottom: 2px; text-transform: uppercase; letter-spacing: .5px; }
  .da .label { color: var(--color-brown); }
  .ok .label { color: var(--color-green-dark); }
  .val { font-size: 22px; font-weight: 800; font-family: Georgia, serif; }
  .da .val { color: var(--color-brown); }
  .ok .val { color: var(--color-green-dark); }
</style>
