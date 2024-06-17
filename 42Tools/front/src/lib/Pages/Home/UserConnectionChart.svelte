<script lang="ts">
  import { Card, Heading } from "flowbite-svelte";
  import { onMount } from "svelte";
  import { httpGet } from "../../../services/http";

  let isLoading = true;
  let data: any[] = [];
  let globalCount: number | null = null;

  onMount(async () => {
    try {
      isLoading = true;
      data = await httpGet("/users-locations/unique-user-month");

      globalCount = 0;

      for (const record of data) {
        globalCount += +record.totalUser;
      }

      isLoading = false;
    } catch (error) {
      console.error(error);
    }
  });
</script>

<Card size="none" padding="xs">
  <div class="flex justify-center flex-col">
    <div class="flex justify-between">
      <!-- <Heading tag="h3"></Heading> -->
      <Heading tag="h5" class="">{globalCount?.toLocaleString() ?? "--"}</Heading>
    </div>

    <h5 class="text-sm">unique student this month</h5>
  </div>
</Card>
