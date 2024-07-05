<script lang="ts">
  import { Badge, Button, Card, Input, Label, Toggle } from "flowbite-svelte";
  //@ts-ignore
  import AutoComplete from "simple-svelte-autocomplete";
  import { onMount } from "svelte";
  import { httpGet } from "../../../services/http";
  import Graph from "./Graph.svelte";
  import type { Projects } from "@back/src/modules/projects/projects.entity";

  interface SimulatedProject {
    uuid: string;
    project: Projects | null | undefined;
    mark: number;

    internshipCalculationsData: {
      [key: string]: number;
      videoMark: number;
      midEvalMark: number;
      finalEvalMark: number;
      contractHours: number;
    };
  }

  const specialInternshipCalculationProjectName = [
    "Internship I",
    "Internship II",
    "Startup Internship",
    "Part_Time I",
    "Part_Time II",
  ];
  /*
    All internships + part-time + startup internship

    (1.25 * [VIDEO FINAL MARK] + 2 * [MID EVAL FINAL MARK] + 4 * [FINAL EVAL MARK]) / 100 * ([CONTRACT HOURS] / 900) * [XP TOTAL PROJECT]
  */

  const xpPerLevel = [
    0, 462, 2688, 5885, 11777, 29217, 46255, 63559, 74340, 85483, 95000, 105630, 124446, 145782, 169932, 197316, 228354,
    263508, 303366, 348516, 399672, 457632, 523320, 597786, 682164, 777756, 886074, 1008798, 1147902, 1305486, 1484070,
  ];

  let enableCoalitionBonus = false;

  let projects: any[] = []; // Import type from back
  let graphData: any[] = []; // Type

  const defaultSimulatedProject: SimulatedProject = {
    internshipCalculationsData: {
      contractHours: 128,
      finalEvalMark: 100,
      midEvalMark: 100,
      videoMark: 100,
    },
    uuid: crypto.randomUUID(),
    mark: 100,
    project: undefined,
  };

  let simulationProjects: SimulatedProject[] = [{ ...defaultSimulatedProject }];
  let user: Partial<Users> = {};

  let baseLevel = 0;
  let baseXp = 0;

  function estimatedLevel(currentXp: number) {
    for (let i = 0; i < xpPerLevel.length; i++) {
      const requiredForNextLevel = xpPerLevel[i] - xpPerLevel[i - 1];
      const missingForNextLevel = xpPerLevel[i] - currentXp;
      const fractionalPart = missingForNextLevel / requiredForNextLevel;

      if (currentXp <= xpPerLevel[i]) {
        return +(i - 1 + 1.0 - fractionalPart).toFixed(2);
      }
    }

    return null;
  }

  function estimatedXp(level: number) {
    const intLevel = Math.trunc(level!);
    const fractLevel = +(level! - intLevel).toFixed(2);
    const xpLevel = xpPerLevel[intLevel];

    const experienceNeedNextLevel = xpPerLevel[intLevel + 1] - xpPerLevel[intLevel];

    return xpLevel + experienceNeedNextLevel * fractLevel;
  }

  function calculateGainedXp(sp: SimulatedProject) {
    let gainedXp = 0;
    if (sp.project == null) return 0;

    if (specialInternshipCalculationProjectName.includes(sp.project.name)) {
      gainedXp =
        ((1.25 * sp.internshipCalculationsData.videoMark +
          2.0 * sp.internshipCalculationsData.midEvalMark +
          4.0 * sp.internshipCalculationsData.finalEvalMark) *
          sp.internshipCalculationsData.contractHours *
          sp.project.experience) /
        90000;
    } else {
      gainedXp = sp.project.experience * (sp.mark / 100) ?? 0;
    }

    return Math.floor(gainedXp * (enableCoalitionBonus ? 1.042 : 1.0));
  }

  function accumulateXpUntil(index: number): number {
    let accumulated = 0;

    for (let i = 0; i <= index; i++) {
      const sp = simulationProjects[i];

      if (sp?.project == null) {
        break;
      }

      accumulated += calculateGainedXp(sp);
    }

    return baseXp + accumulated;
  }

  onMount(async () => {
    user = await httpGet("/users/me");
    projects = await httpGet(`/projects?cursusId=21`);

    baseLevel = user.level!;
    baseXp = estimatedXp(user.level!);

    // baseLevel = 15.29;
    // simulationProjects = [
    //   {
    //     uuid: crypto.randomUUID(),
    //     mark: 100,
    //     project: projects.find((p) => p.name === "Internship I"),
    //     internshipCalculationsData: {
    //       videoMark: 100,
    //       midEvalMark: 123,
    //       finalEvalMark: 125,
    //       contractHours: 128,
    //     },
    //   },
    // ];
  });

  $: if (simulationProjects && baseXp > 0) {
    graphData = [
      {
        level: estimatedLevel(baseXp),
        projectName: "Base",
      },
    ];

    for (let i = 0; i < simulationProjects.length; i++) {
      const sp = simulationProjects[i];

      if (sp.project == null) continue;

      graphData.push({
        level: estimatedLevel(accumulateXpUntil(i)),
        projectName: sp.project.name,
      });
    }

    if (simulationProjects[simulationProjects.length - 1].project != null) {
      simulationProjects = [
        ...simulationProjects,
        {
          ...structuredClone(defaultSimulatedProject),
          uuid: crypto.randomUUID(),
        },
      ];
    }
  }

  $: if (enableCoalitionBonus || !enableCoalitionBonus) {
    simulationProjects = simulationProjects;
  }

  $: if ([baseLevel]) {
    baseXp = estimatedXp(baseLevel);
  }

  $: if (simulationProjects) {
    for (const sproject of simulationProjects) {
      sproject.mark = Math.max(0, Math.min(sproject.mark, 125));

      for (const key in sproject.internshipCalculationsData) {
        if (key === "contractHours") continue;

        sproject.internshipCalculationsData[key] = Math.max(0, Math.min(sproject.internshipCalculationsData[key], 125));
      }
    }

    console.log(" Update");
  }
</script>

<h5 class="text-3xl mb-2">Calculator</h5>

<h5 class="text-xl mb-4 mt-4">Settings</h5>

<div class="flex flex-col gap-4">
  <Toggle checked={enableCoalitionBonus} on:change={() => (enableCoalitionBonus = !enableCoalitionBonus)}>
    Coalition bonus active (increase xp gain by&nbsp;<span class="font-bold">4.2%</span>)
  </Toggle>
  <div>
    <div class="mb-1">Custom starting level</div>
    <Input size="sm" type="number" class="!text-lg" min={0} max={29} bind:value={baseLevel} />
  </div>
</div>

<h5 class="text-xl mb-4 mt-8 flex items-end justify-between">
  <div>Calculator</div>
  <div>
    <Button
      color="yellow"
      class="px-6 py-2 "
      outline
      on:click={() => {
        baseLevel = user.level;

        simulationProjects = [
          {
            ...defaultSimulatedProject,
            uuid: crypto.randomUUID(),
          },
        ];
      }}
    >
      Reset
    </Button>
  </div>
</h5>
<div>
  <div class="flex flex-col gap-2">
    {#if projects.length}
      {#each simulationProjects as sproject, index (sproject.uuid)}
        <div class="gap-4 flex flex-col md:flex-row bg-white shadow dark:bg-gray-800 p-4 rounded">
          <div class="flex gap-4 w-full">
            <div class="w-full">
              <AutoComplete
                className="w-full"
                bind:selectedItem={sproject.project}
                inputClassName="dark:text-white dark:bg-gray-800 rounded"
                dropdownClassName="dark:!text-white dark:!bg-gray-800 rounded"
                selectName="text-white"
                labelFieldName="name"
                placeholder="Project name..."
                items={projects.filter((p) => p.experience).map((p) => ({ ...p, name: `${p.name}` }))}
              />
            </div>
            <div class="w-24">
              <Input
                size="sm"
                min={0}
                max={125}
                type="number"
                bind:value={sproject.mark}
                disabled={sproject.project && specialInternshipCalculationProjectName.includes(sproject.project.name)}
              />
            </div>
          </div>

          <div class="flex-grow flex gap-2 items-center justify-between">
            <div class="w-32 flex-grow text-center">
              <Badge color="dark" class="text-lg w-full">
                + {calculateGainedXp(sproject).toLocaleString()} XP
              </Badge>
            </div>
            <div class="w-24 flex-grow text-center">
              {#key baseLevel}
                <Badge class="text-lg w-full" color="indigo">
                  Lv. {estimatedLevel(accumulateXpUntil(index)) ?? "Unknown"}
                </Badge>
              {/key}
            </div>
            <div class="w-6">
              {#if (sproject.project != null || simulationProjects.length > 1) && index !== simulationProjects.length - 1}
                <button
                  on:click={() => {
                    simulationProjects = simulationProjects.filter((p) => p !== sproject);
                  }}
                >
                  <i class="ti ti-trash text-xl text-red-500" />
                </button>
              {/if}
            </div>
          </div>
        </div>

        {#if sproject.project && specialInternshipCalculationProjectName.includes(sproject.project.name)}
          <div class="bg-white dark:bg-gray-800 px-4 pb-3 shadow rounded" style="margin-top: -11px">
            <div class="flex gap-3">
              <div class="flex-grow">
                <Label>Total open-days during contract</Label>
                <Input type="number" min={0} max={990} bind:value={sproject.internshipCalculationsData.contractHours} />
              </div>
              <div class="flex-grow">
                <Label>Mid Eval Mark</Label>
                <Input type="number" min={0} max={125} bind:value={sproject.internshipCalculationsData.midEvalMark} />
              </div>
              <div class="flex-grow">
                <Label>Final Eval Mark</Label>
                <Input type="number" min={0} max={125} bind:value={sproject.internshipCalculationsData.finalEvalMark} />
              </div>
              <div class="flex-grow">
                <Label>Video Mark</Label>
                <Input type="number" min={0} max={125} bind:value={sproject.internshipCalculationsData.videoMark} />
              </div>
            </div>
          </div>
        {/if}
      {/each}
    {/if}
  </div>
</div>

<h5 class="text-xl mb-4 mt-4">Graph</h5>
<Card padding="xs" size="none" style="height: 300px">
  <Graph data={graphData} />
</Card>

<style lang="scss">
  :global(.autocomplete-list-item) {
    color: gray !important;
  }
</style>
