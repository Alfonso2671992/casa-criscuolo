<script lang="ts">
  import type { Category } from '$lib/types';

  let { categories, selected = $bindable(''), columns = 4 }: {
    categories: Category[]; selected?: string; columns?: number;
  } = $props();
</script>

<div class="grid" style="grid-template-columns: repeat({columns},1fr)">
  {#each categories as cat}
    <button
      class="cat-btn"
      class:active={selected === cat.id}
      style="border-color:{selected === cat.id ? cat.color : '#EDD9C0'};background:{selected === cat.id ? cat.bg : '#FAF3E8'}"
      onclick={() => selected = cat.id}
    >
      <div style="color:{selected === cat.id ? cat.color : '#C4A070'}">{@html cat.svg}</div>
      <span style="color:{selected === cat.id ? cat.color : '#8B6040'}">{cat.label}</span>
    </button>
  {/each}
</div>

<style>
  .grid { display: grid; gap: 6px; margin-bottom: 12px; }
  .cat-btn {
    all: unset; display: flex; flex-direction: column; align-items: center; gap: 3px;
    padding: 8px 3px; border-radius: 11px; background: #FAF3E8;
    border: 2px solid #EDD9C0; cursor: pointer; box-sizing: border-box; color: #C4A070;
  }
  .cat-btn span { font-size: 9px; font-weight: 600; color: #8B6040; line-height: 1.2; text-align: center; }
  .active span { font-weight: 800; }
</style>
