<script lang="ts">
  import type { RncpDefinitionInterface } from "@back/src/modules/rncp-definition/rncp-definition.service";

  import { Card, Progressbar } from "flowbite-svelte";
  import { onMount } from "svelte";

  export let myGlobalProgress: any[];
  export let selectedRncpIndex: number;
  export let rncpDefinition: RncpDefinitionInterface[];

  export let realData: Record<string, any> = { level: null, events: null, proExp: null };

  export let title: string;

  let keyRncp = "";
  let keyProgress = "";

  let color: any = "red";

  onMount(() => {
    if (title === "Level") {
      keyRncp = "levelRequired";
      keyProgress = "level";
    }

    if (title === "Events") {
      keyRncp = "eventRequired";
      keyProgress = "events";
    }

    if (title === "Experiences") {
      keyRncp = "proExperienceRequired";
      keyProgress = "proExp";
    }
  });

  $: [selectedRncpIndex, myGlobalProgress] && calculateCurrent(keyRncp, keyProgress);

  //TODO: Get real values from back-end
  function calculateCurrent(keyRncp: string, keyGlobalProgress: string) {
    const currentProgress = myGlobalProgress[selectedRncpIndex].details[keyGlobalProgress] * 0.01;

    //@ts-ignore
    const progress = rncpDefinition[selectedRncpIndex].sections[0][keyRncp] * currentProgress;

    if (currentProgress >= 1.0) {
      color = "green";
    } else if (currentProgress >= 0.5) {
      color = "yellow";
    } else if (currentProgress >= 20) {
      color = "indigo";
    } else {
      color = "red";
    }

    if (keyGlobalProgress === "level" && realData.level) {
      return realData.level.toFixed(2);
    }

    if (keyGlobalProgress === "level") {
      return progress.toFixed(2);
    } else {
      return progress.toFixed(0);
    }
  }
</script>

<Card size="none" padding="xs">
  <span class="flex items-center justify-between mb-1 flex-col md:flex-row">
    <span class="text-md">
      {title}
    </span>
    <span>
      {#key selectedRncpIndex}
        <b class="text-lg">{calculateCurrent(keyRncp, keyProgress)}</b>
      {/key}/
      {rncpDefinition[selectedRncpIndex].sections[0][keyRncp]}
    </span>
  </span>

  <Progressbar {color} size="h-2" progress={myGlobalProgress[selectedRncpIndex].details[keyProgress]} />
</Card>
