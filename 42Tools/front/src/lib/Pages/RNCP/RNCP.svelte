<script lang="ts">
  import { onMount } from "svelte";
  import { httpGet, httpPost, userSession } from "../../../services/http";
  import RncpProgressPreviewCard from "./RncpProgressPreviewCard.svelte";

  import type { ProjectUsers } from "@back/src/modules/project-users/project-users.entity";
  import type { RncpDefinitionInterface } from "@back/src/modules/rncp-definition/rncp-definition.service";
  import type { CachedRncpProgress } from "@back/src/modules/rncp-progress/rncp-progress.entity";

  import { Alert, Button, Card, TextPlaceholder } from "flowbite-svelte";
  import GlobalRequierementCard from "./GlobalRequierementCard.svelte";
  import RncpSectionProgress from "./RncpSectionProgress.svelte";
  import type { Users } from "@back/src/modules/users/users.entity";
  import dayjs from "dayjs";

  export let studentId: string | null = null;

  let isLoading = true;

  let userInfos: Users;
  let rncpDefinition: RncpDefinitionInterface[] = [];
  let myGlobalProgress: any[] = [];

  let validatedProjects: ProjectUsers[] = [];

  let selectedRncpIndex = 0;

  //Temporary. Will get student info from "/users/studentId" soon
  let _tmpStudentName = "";

  onMount(async () => {
    isLoading = true;

    userInfos = await httpGet("/users/" + (studentId ?? "me"));
    rncpDefinition = await httpGet("/rncp-definition");

    let myProgress: CachedRncpProgress[] = [];

    if (studentId) {
      myProgress = await httpGet("/rncp-progress/" + studentId);
      validatedProjects = await httpGet("/project-users/" + studentId);
      _tmpStudentName = myProgress?.[0]?.user?.login ?? "unknown";
    } else {
      myProgress = await httpGet("/rncp-progress/mine");
      validatedProjects = await httpGet("/project-users/mine");
    }

    let max = 0;

    for (const def of rncpDefinition) {
      const suite = def.sections.find((s) => s.section === "Suite")!;
      def.sections = def.sections.filter((s) => s.section !== "Suite");
      def.sections = [...def.sections, suite];

      // def.sections = def.sections.sort((a, b) => (a.section === "Suite" ? 10000 : a.section!.localeCompare(b.section!)));
    }

    rncpDefinition = rncpDefinition.sort((a, b) => a.level - b.level);

    for (const rncp of rncpDefinition) {
      const rncpProgress = {
        xp: 0,
        count: 0,
        level: 0,
        events: 0,
        proExp: 0,
      };

      const sectionLen = rncp.sections.length;

      let sectionProgress = 0;

      for (const section of rncp.sections) {
        const mySectionProgress = myProgress.find((gp) => gp.rncp.id === section.id);

        if (mySectionProgress == null) {
          continue;
        }

        sectionProgress += mySectionProgress.totalProgress;

        rncpProgress.level = mySectionProgress.levelProgress;
        rncpProgress.events = mySectionProgress.eventProgress;
        rncpProgress.proExp = mySectionProgress.proExpProgress;
      }

      rncpProgress.count = rncpProgress.count / sectionLen;
      rncpProgress.xp = rncpProgress.xp / sectionLen;

      let percent = +(sectionProgress / sectionLen).toFixed(2);

      if (percent >= max && percent < 100) {
        selectedRncpIndex = rncpDefinition.findIndex((d) => d.level === rncp.level && d.option === rncp.option);
        max = percent;
      }

      myGlobalProgress.push({
        rncpLevel: rncp.level,
        rncpOption: rncp.option,
        rncpProgress: percent,

        details: rncpProgress,
      });
    }

    myGlobalProgress = myGlobalProgress;

    setTimeout(() => {
      isLoading = false;
    }, 250);
  });

  async function forceReupdate() {
    try {
      await httpPost(`/users/force-reupdate/${(studentId ?? $userSession?.id)}`)
      userInfos = await httpGet("/users/" + (studentId ?? $userSession?.id));
    } catch(error){ 
      console.error(error)
    }
  }
</script>

<div>
  <div class=" dark:text-white mb-4 flex justify-between">
    <p class="text-2xl font-bold">
      {#if studentId}
        {_tmpStudentName}'s
      {:else}
        My
      {/if}
      progression
    </p>
    <div>
      {#if userInfos?.lastUpdatedAt && dayjs(userInfos.lastUpdatedAt).diff(undefined, "day") <= -2}
        <Button color="purple" on:click={() => forceReupdate()}>Something wrong ? Trigger an update !</Button>
        {:else if userInfos?.lastUpdatedAt == null}
          Update queued, come back later.
          {:else}
          <div class="text-sm">
            User Updated At : {dayjs(userInfos.lastUpdatedAt).format("DD/MM/YY HH[h]")}<br/>
            RNCP Updated At : {dayjs(userInfos.lastCachedProgressUpdatedAt).format("DD/MM/YY HH[h]")}
          </div>
        {/if}
    </div>
 
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-2 gap-2 mb-5">
    {#if isLoading}
      <Card>
        <TextPlaceholder size="md" />
      </Card>
      <Card>
        <TextPlaceholder size="md" />
      </Card>
      <Card>
        <TextPlaceholder size="md" />
      </Card>
      <Card>
        <TextPlaceholder size="md" />
      </Card>
    {:else}
      {#each myGlobalProgress as rncpProgress, index}
        <RncpProgressPreviewCard
          on:click={() => {
            selectedRncpIndex = index;
          }}
          active={index === selectedRncpIndex}
          rncpLevel={rncpProgress.rncpLevel}
          rncpOption={rncpProgress.rncpOption}
          rncpProgress={rncpProgress.rncpProgress}
        />
      {/each}
    {/if}
  </div>

  <p class="text-2xl dark:text-white font-bold mb-2">Detail</p>

  <p class="text-lg dark:text-white mb-2">Global requierements progression</p>

  <div class="mb-2 grid grid-cols-1 lg:grid-cols-3 gap-1">
    {#if isLoading === false && rncpDefinition[selectedRncpIndex]}
      <GlobalRequierementCard {myGlobalProgress} {selectedRncpIndex} {rncpDefinition} title="Level" />
      <GlobalRequierementCard {myGlobalProgress} {selectedRncpIndex} {rncpDefinition} title="Events" />
      <GlobalRequierementCard {myGlobalProgress} {selectedRncpIndex} {rncpDefinition} title="Experiences" />
    {:else}
      <Card size="none">
        <TextPlaceholder size="none" />
      </Card>
      <Card size="none">
        <TextPlaceholder size="none" />
      </Card>
      <Card size="none">
        <TextPlaceholder size="none" />
      </Card>
    {/if}
  </div>

  <div>
    <p class="text-lg dark:text-white mt-4 mb-2">Project progression</p>
    <Alert class="mb-2" color="gray">
      Tips : You can click on a project to simulate validation
    </Alert>

    <div class="gap-2 grid grid-cols-1 md:grid-cols-2 lg:flex">
      {#if isLoading === false && rncpDefinition[selectedRncpIndex]}
        {#each rncpDefinition[selectedRncpIndex].sections as section (section.section)}
          <RncpSectionProgress {section} projectsUser={validatedProjects} />
        {/each}
      {:else}
        <Card size="lg">
          <TextPlaceholder size="md" />
        </Card>
        <Card size="lg">
          <TextPlaceholder size="md" />
        </Card>
        <Card size="lg">
          <TextPlaceholder size="md" />
        </Card>
      {/if}
    </div>
  </div>
</div>
