<script lang="ts">
  import { Card, Heading, Span } from "flowbite-svelte";
  import { onMount } from "svelte";
  import { httpGet } from "../../../services/http";

  let globalStat: any = {
    ratio: null,
    total: null,
    count: null,
  };

  onMount(async () => {
    try {
      let data = await httpGet("/users/over-level-twenty-one");

      data = data[0];

      globalStat.ratio = (+data.over / +data.users) * 100;
      globalStat.total = +data.users;
      globalStat.count = +data.over;
    } catch (error) {
      console.error(error);
    }
  });
</script>

<Card size="none" padding="xs">
  <div class="flex justify-center flex-col">
    <div class="flex justify-between">
      <Heading tag="h5"
        >{globalStat.count?.toLocaleString() ?? "--"} of {globalStat.total?.toLocaleString() ?? "--"}</Heading
      >
      <Heading tag="h5" class="text-right">{globalStat.ratio?.toFixed(1) ?? "--"} %</Heading>
    </div>

    <h5 class="text-sm">students are <Span underline>level 21</Span> or over</h5>
  </div>
</Card>
