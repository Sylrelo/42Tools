<script lang="ts">
  import { Card, Heading, Span, Spinner } from "flowbite-svelte";
  import { onMount } from "svelte";
  import { httpGet } from "../../../services/http";

  let validatedProject: any[] = [];
  let globalStats: any = {
    count: null,
    mark: null,
  };

  onMount(async () => {
    try {
      validatedProject = await httpGet("/project-users/recently-validated-projects");

      for (const p of validatedProject) {
        globalStats.count += +p.count;
        globalStats.mark += +p.average_final_mark;
      }

      globalStats.mark /= validatedProject.length;
    } catch (error) {
      console.error(error);
    } finally {
    }
  });
</script>

<Card size="none" padding="xs">
  <div class="flex justify-center flex-col">
    <div class="flex justify-between">
      <Heading tag="h5">{globalStats.count ?? "--"}</Heading>
      <Heading tag="h5" class="text-right">{globalStats.mark?.toFixed(1) ?? "--"} %</Heading>
    </div>

    <div class="flex justify-between">
      <h5 class="text-sm">projects validated this week</h5>
      <h5 class="text-sm">average mark</h5>
    </div>
  </div>
</Card>
