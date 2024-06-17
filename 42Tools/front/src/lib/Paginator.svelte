<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";

  export let totalPage: number;
  export let currentPage: number;

  const dispatch = createEventDispatcher();

  let buttons: number[] = [];

  $: if (totalPage || currentPage || !totalPage) {
    generateButtons();
  }

  onMount(() => {
    generateButtons();
  });

  function generateButtons() {
    buttons = [];

    let _max = Math.min(totalPage, currentPage);

    for (let i = Math.max(0, currentPage - 4); i < _max; i++) {
      buttons.push(i + 1);
    }

    _max = Math.min(totalPage, currentPage + 4);
    for (let i = currentPage; i < _max; i++) {
      buttons.push(i + 1);
    }

    buttons = buttons;
  }

  const LI_CLASS =
    "flex cursor-pointer items-center justify-center px-3 h-10 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white";
</script>

{#key currentPage}
  <div>
    <ul class="inline-flex -space-x-px text-base h-10">
      <button class={LI_CLASS} on:click={() => dispatch("pageChange", 1)}>First</button>
      <!-- <li class={LI_CLASS}>Prev</li> -->

      {#each buttons as button (button)}
        <button
          on:click={() => {
            dispatch("pageChange", button);
          }}
          class="{LI_CLASS} {currentPage === button ? 'dark:bg-gray-900 bg-gray-600 font-bold' : ''}"
        >
          {button}
        </button>
      {/each}

      <!-- <li class={LI_CLASS}>Next</li> -->
      <button class={LI_CLASS} on:click={() => dispatch("pageChange", totalPage)}>Last ({totalPage})</button>
    </ul>
  </div>
{/key}
