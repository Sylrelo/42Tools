<script lang="ts">
  import { Card, Heading, Span } from "flowbite-svelte";
  import { onMount } from "svelte";
  import { httpGet } from "../../../services/http";

  let data: any[] = [];
  let isLoading = true;
  let globalStat: any = {
    ratio: null,
    totalUser: null,
    validatedCount: null,
  };

  onMount(async () => {
    try {
      data = await httpGet("/project-users/stats-transcendence-validation");

      globalStat.totalUser = data.reduce((old, c) => old + +c.totalUser, 0);
      globalStat.validatedCount = data.reduce((old, c) => old + +c.validatedCount, 0);

      globalStat.ratio = +((globalStat.validatedCount / globalStat.totalUser) * 100).toFixed(1);

      isLoading = false;
    } catch (error) {
      console.error(error);
    }
  });
</script>

<Card size="none" padding="xs">
  <div class="flex justify-center flex-col">
    <div class="flex justify-between">
      <Heading tag="h5">
        {globalStat.validatedCount?.toLocaleString() ?? "--"} of {globalStat.totalUser?.toLocaleString() ?? "--"}
      </Heading>
      <Heading tag="h5" class="text-right">
        {globalStat.ratio ?? "--"} %
      </Heading>
    </div>

    <h5 class="text-sm">students have finished <Span underline>Transcendence</Span></h5>
  </div>
</Card>
