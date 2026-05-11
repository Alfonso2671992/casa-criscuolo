<script lang="ts">
  let { message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void } = $props();
</script>

<div class="overlay" onclick={onCancel} role="presentation">
  <div class="box" onclick={(e) => e.stopPropagation()} onkeydown={(e) => { if (e.key === 'Escape') onCancel(); }} role="dialog" tabindex="-1">
    <div class="title">Conferma</div>
    <p class="msg">{message}</p>
    <div class="btns">
      <button class="btn-confirm" onclick={onConfirm}>Conferma</button>
      <button class="btn-cancel" onclick={onCancel}>Annulla</button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed; inset: 0; background: var(--overlay-bg); z-index: 200;
    display: flex; align-items: center; justify-content: center;
    padding: 0 20px;
  }
  .box {
    background: var(--bg-card); border-radius: 18px; padding: 24px 22px 18px;
    width: 320px; max-width: 88vw; text-align: center;
  }
  .title { font-size: 16px; font-weight: 800; color: var(--text-primary); margin-bottom: 12px; }
  .msg { font-size: 14px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 20px; }
  .btns { display: flex; gap: 10px; }
  .btn-confirm, .btn-cancel {
    all: unset; flex: 1; padding: 12px; border-radius: 12px;
    font-size: 14px; font-weight: 700; text-align: center; cursor: pointer; box-sizing: border-box;
  }
  .btn-confirm { background: var(--accent); color: var(--color-white); }
  .btn-cancel { background: var(--bg-secondary); color: var(--text-muted); }
</style>
