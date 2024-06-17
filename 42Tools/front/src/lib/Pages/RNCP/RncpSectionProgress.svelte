<script lang="ts">
  import type { ProjectUsers } from "@back/src/modules/project-users/project-users.entity";
  import type { RncpDefinitionProjects } from "@back/src/modules/rncp-definition/rncp-definition-projects";
  import type { RncpDefinition } from "@back/src/modules/rncp-definition/rncp-definition.entity";
  import { Badge, Card, Indicator } from "flowbite-svelte";
  import { onMount } from "svelte";

  export let section: RncpDefinition;
  export let projectsUser: ProjectUsers[] = [];

  let projects: { [key: number]: any } = {};

  let totalProjects = 0;
  let totalXp = 0;

  onMount(() => {
    section.projects.sort((a, b) => a.project.name.localeCompare(b.project.name));

    for (const rncpProject of section.projects) {
      const validatedProject = projectsUser.find((pu) => pu.project.id === rncpProject.project.id);

      if (validatedProject != null) {
        totalProjects += 1;
        totalXp += validatedProject.gainedExperience;

        projects[validatedProject.project.id] = {
          mark: validatedProject.finalMark,
          xp: validatedProject.gainedExperience,
        };
      }

      for (const childrenProject of rncpProject.childrenProjects) {
        const validatedProject = projectsUser.find((pu) => pu.project.id === childrenProject.id);

        if (validatedProject != null) {
          totalXp += validatedProject.gainedExperience;

          projects[validatedProject.project.id] = {
            mark: validatedProject.finalMark,
            xp: validatedProject.gainedExperience,
          };

          const tmpOldRncpProject = projects[rncpProject.project.id] ?? {};

          projects[rncpProject.project.id] = {
            mark: tmpOldRncpProject.mark ?? 0,
            xp: (tmpOldRncpProject.xp ?? 0) + validatedProject.gainedExperience,
          };
        }
      }
    }

    section.projects = section.projects;
  });

  function getColor(currentValue: number, maxValue: number) {
    if (currentValue >= maxValue) {
      return "green";
    }

    if (currentValue >= maxValue / 2) {
      return "yellow";
    }

    return "red";
  }

  function calculateProjectExperience(rdp: RncpDefinitionProjects) {
    if (rdp.childrenProjects.length === 0)
      return rdp.project.experience;

    return rdp.childrenProjects.reduce((acc, cp) => cp.experience + acc, 0);
  }
</script>

<Card size="none" padding="none" class="px-3 py-3">
  <p class="text-center text-lg font-bold mb-2 text-black dark:text-white">
    {section.section}
  </p>

  <div class="mb-2 flex gap-2 flex-wrap">
    <Badge color={getColor(totalProjects, section.totalProjectCount)} class="px-2.5 py-1.5 text-md grow ">
      <Indicator color={getColor(totalProjects, section.totalProjectCount)} class="me-2" />
      <span class="font-bold">{totalProjects}</span>&nbsp;/ {section.totalProjectCount} projects
    </Badge>

    {#if section.totalProjectExperience > 0}
      <Badge color={getColor(totalXp, section.totalProjectExperience)} class="px-2.5 py-1.5 text-md grow">
        <Indicator color={getColor(totalXp, section.totalProjectExperience)} class="me-2" />
        <span class="font-bold">{totalXp.toLocaleString()}</span>&nbsp;/ {section.totalProjectExperience.toLocaleString()}
        XP
      </Badge>
    {/if}
  </div>
  <div class="">
    {#each section.projects as project}
      <div class="flex flex-col items-start w-full">
        <div class="flex flex-row mt-1.5 items-center w-full">
          <div>
            <Indicator
              rounded
              color={projects[project.project.id]?.mark > 0 ? "green" : "red"}
              class="me-1.5"
              size="lg"
            />
          </div>
          <div class="flex items-center grow" class:font-bold={projects[project.project.id]}>
            <div>
              <div class="text-sm">
                {project.project.name.replaceAll("[DEPRECATED]", "Old ")}
              </div>
              <div>
                {#if projects[project.project.id] && !project.childrenProjects.length}
                  <div>
                    <Badge color="green">{projects[project.project.id].mark} / 100</Badge>
                    <Badge color="green">{projects[project.project.id].xp.toLocaleString()} XP</Badge>
                  </div>
                {:else if projects[project.project.id]?.xp > 0}
                  <div>
                    <Badge color={getColor(projects[project.project.id].mark, 100)}
                      >{projects[project.project.id].mark} / 100</Badge
                    >
                    <Badge color="green">{projects[project.project.id].xp} XP</Badge>
                  </div>
                {:else}
                  <Badge color="dark">{calculateProjectExperience(project).toLocaleString()} XP</Badge>
                {/if}
              </div>
            </div>
          </div>
        </div>

        {#if project.childrenProjects.length}
          <div class="text-xs mt-0.5">
            {#each project.childrenProjects as cp}
              <div class="flex items-center gap-2 mx-5">
                <Indicator color={projects[cp.id] ? "green" : "red"} />
                {cp.name}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</Card>
