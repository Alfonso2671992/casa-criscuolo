<script lang="ts">
  import { logout, auth } from '$lib/firebase-client';
  import { showToast } from '$lib/stores';

  let { onClose }: { onClose: () => void } = $props();

  const email = $derived(auth.currentUser?.email ?? '');
  const initial = $derived((email || 'A').charAt(0).toUpperCase());
  const colors = [
    { bg: '#C2185B', text: '#FFF' },
    { bg: '#C4622D', text: '#FFF' },
  ];
  const colorIdx = $derived.by(() => {
    let h = 0;
    for (let i = 0; i < email.length; i++) h += email.charCodeAt(i);
    return h % colors.length;
  });
  const { bg, text } = $derived(colors[colorIdx]);

  async function handleLogout() {
    await logout();
    showToast('Disconnesso');
    onClose();
  }
</script>

<div class="overlay" onclick={onClose} role="presentation">
  <div class="box" onclick={(e) => e.stopPropagation()} onkeydown={(e) => { if (e.key === 'Escape') onClose(); }} role="dialog" tabindex="-1">
    <div class="avatar" style="background:{bg};color:{text}">{initial}</div>
    <div class="email">{email}</div>
    <button class="btn-logout" onclick={handleLogout}>Disconnetti</button>
    <button class="btn-close" onclick={onClose}>Chiudi</button>
  </div>
</div>

<style>
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: 100;
    display: flex; align-items: center; justify-content: center;
  }
  .box {
    background: #FAF3E8; border-radius: 18px; padding: 28px;
    width: 280px; max-width: 92vw; display: flex; flex-direction: column; align-items: center;
  }
  .avatar {
    width: 48px; height: 48px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; font-weight: 800; margin-bottom: 10px;
  }
  .email { font-size: 13px; color: #8B6040; font-weight: 500; margin-bottom: 24px; word-break: break-all; text-align: center; }
  .btn-logout, .btn-close {
    all: unset; display: block; width: 100%; padding: 11px; border-radius: 12px;
    font-size: 14px; font-weight: 700; text-align: center; cursor: pointer;
    box-sizing: border-box;
  }
  .btn-logout { background: #C4622D; color: #FFF; }
  .btn-close { background: transparent; color: #A07850; margin-top: 8px; }
</style>
