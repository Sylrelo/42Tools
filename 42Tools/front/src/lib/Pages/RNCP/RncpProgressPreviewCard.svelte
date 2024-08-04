<script lang="ts">
  import { Card } from "flowbite-svelte";

  export let rncpLevel: string;
  export let rncpOption: string;
  export let rncpProgress: number;
  export let active: boolean = false;

  let activeClasses = "";

  $: if (active || !active) {
    activeClasses = active
      ? "dark:text-white outline outline-1 outline-black dark:outline-white"
      : "dark:text-gray-400 ";
  }
</script>

<Card on:click size="none" class={"cursor-pointer flex flex-col justify-between p-2 md:p-4 " + activeClasses}>
  <h5 class="text-xl md:text-2xl flex justify-between">
    <div>
      RNCP {rncpLevel}
    </div>
    <div>
      <p class="text-xl md:text-2xl font-bold">{rncpProgress} %</p>
    </div>
  </h5>
  <p class="text-sm md:text-lg">{rncpOption}</p>
</Card>
