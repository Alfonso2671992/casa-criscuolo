<script lang="ts">
  import { wishes } from '$lib/stores';
  import type { WishItem } from '$lib/types';

  let selected = $state<WishItem | null>(null);

  function open(photo: WishItem) {
    selected = photo;
  }

  function close() {
    selected = null;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      close();
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if ((e.target as HTMLElement).dataset.lightbox === 'backdrop') {
      close();
    }
  }

  let photos = $state<WishItem[]>([]);
  $effect(() => {
    photos = $wishes.filter((w) => w.p);
  });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if photos.length === 0}
  <div class="empty">Nessuna foto</div>
{:else}
  <div class="gallery">
    {#each photos as photo (photo._k)}
      <button class="card" onclick={() => open(photo)}>
        <div class="card-img-wrap">
          <img src={photo.p} alt={photo.n} loading="lazy" />
        </div>
        <div class="card-label">{photo.n}</div>
      </button>
    {/each}
  </div>
{/if}

{#if selected}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    class="lightbox"
    data-lightbox="backdrop"
    role="dialog"
    tabindex="-1"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
  >
    <button class="close" onclick={close} aria-label="Chiudi">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
    <div class="lightbox-content">
      <img src={selected.p} alt={selected.n} class="lightbox-img" />
      <div class="lightbox-info">
        <span class="lightbox-name">{selected.n}</span>
        <span class="lightbox-cat">{selected.c}</span>
      </div>
    </div>
  </div>
{/if}

<style>
  .gallery {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .card {
    all: unset;
    display: flex;
    flex-direction: column;
    background: #FDF6EC;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
  }

  .card-img-wrap {
    aspect-ratio: 1 / 1;
    overflow: hidden;
  }

  .card-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .card-label {
    padding: 8px 10px;
    font-size: 12px;
    font-weight: 600;
    color: #3D2010;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lightbox {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    z-index: 300;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  .lightbox-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 90vw;
  }

  .lightbox-img {
    max-width: 90vw;
    max-height: 75vh;
    object-fit: contain;
    border-radius: 8px;
  }

  .lightbox-info {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .lightbox-name {
    color: #fff;
    font-size: 16px;
    font-weight: 700;
  }

  .lightbox-cat {
    color: #D4A574;
    font-size: 13px;
  }

  .close {
    all: unset;
    position: absolute;
    top: 16px;
    right: 16px;
    cursor: pointer;
    z-index: 301;
    padding: 8px;
  }

  .empty {
    text-align: center;
    color: #8B6040;
    font-size: 14px;
    padding: 32px 0;
  }
</style>
