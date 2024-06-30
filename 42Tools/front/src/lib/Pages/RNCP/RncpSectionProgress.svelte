<script lang="ts">
  import type { ProjectUsers } from "@back/src/modules/project-users/project-users.entity";
  import type { RncpDefinitionProjects } from "@back/src/modules/rncp-definition/rncp-definition-projects";
  import type { RncpDefinition } from "@back/src/modules/rncp-definition/rncp-definition.entity";
  import { Badge, Card, Indicator, Input } from "flowbite-svelte";
  import { onMount } from "svelte";


  // TODO: Simplify HTML and Logic for simulation

  export let section: RncpDefinition;
  export let projectsUser: ProjectUsers[] = [];
  
  let customProjectsUser: Record<string, {
    mark: number,
  }> = {};

  let projects: { [key: number]: any } = {};

  let totalProjects = 0;
  let totalXp = 0;

  onMount(() => {
    customProjectsUser = {};

    for (const rncpProject of section.projects) {
      for (const cp of rncpProject.childrenProjects) {
        customProjectsUser[cp.id] = {
          mark: 0
        };
      }
      customProjectsUser[rncpProject.project.id] = {
        mark: 0
      };
    }

    parseData();
  });

  function parseData() {
    section.projects.sort((a, b) => a.project.name.localeCompare(b.project.name));

    totalXp = 0;
    totalProjects = 0;

    for (const rncpProject of section.projects) {
      const validatedProject = projectsUser.find((pu) => pu.project.id === rncpProject.project.id);
      const customProject = customProjectsUser[rncpProject.project.id];

      if (validatedProject != null) {
        totalProjects += 1;
        totalXp += validatedProject.gainedExperience;

        projects[validatedProject.project.id] = {
          mark: validatedProject.finalMark,
          xp: validatedProject.gainedExperience,
        };
      }

      if (+customProject?.mark !== 0 && rncpProject.childrenProjects.length === 0) {
        totalProjects += 1;
        totalXp += (+customProject.mark / 100) * rncpProject.project.experience;
      }

      for (const childrenProject of rncpProject.childrenProjects) {
        const validatedProject = projectsUser.find((pu) => pu.project.id === childrenProject.id);
        const customPoolProject = customProjectsUser[childrenProject.id];

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

        if (+customPoolProject?.mark !== 0 ) {
          totalXp += (+customPoolProject.mark / 100) * childrenProject.experience;
        }
      }
    }

    section.projects = section.projects;
  }

  $: if (Object.keys(customProjectsUser).length !== 0) {
    parseData();
  }
  
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

  function calculateCustomMarkForPoolGainedExperience(rdp: RncpDefinitionProjects) {
    let total = 0;

    for (const project of rdp.childrenProjects) {
      const customMark = customProjectsUser[project.id];

      if (customMark) {
        total += (customMark.mark / 100) * project.experience;
      }
    }

    return total;
  }

  function getColorForIndicator(projectId: number) {
    // if (customProjectsUser[projectId]?.mark >= 1)
    //   return "yellow";
    
    return projects[projectId]?.mark > 0 ? "green" : "red"
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
              color={getColorForIndicator(project.project.id)}
              class="me-1.5"
              size="lg"
            />
          </div>
          <div class="flex items-center grow" class:font-bold={projects[project.project.id]}>
            <div class="flex justify-between w-full">
              <div class="text-sm">
                {project.project.name.replaceAll("[DEPRECATED]", "Old ")}
              </div>
              <div>
                {#if projects[project.project.id] && !project.childrenProjects.length}
                  <div>
                    <Badge color="green">{projects[project.project.id].mark} / 100</Badge>
                    <Badge color="green" class="w-24">{projects[project.project.id].xp.toLocaleString()} XP</Badge>
                  </div>
                {:else if projects[project.project.id]?.xp > 0}
                  <div>
                    <Badge color={getColor(projects[project.project.id].mark, 100)}>
                      {projects[project.project.id].mark} / 100
                      </Badge>
                    <Badge color="green" class="w-24">{projects[project.project.id].xp} XP</Badge>
                  </div>
                {:else if customProjectsUser[project.project.id]}
                  {#if project.childrenProjects.length === 0}
                    <input 
                      type="text" 
                      class="siminput text-sm dark:bg-gray-600 dark:text-white text-black bg-gray-100"
                      bind:value={customProjectsUser[project.project.id].mark}
                      on:input={event => {
                        //@ts-ignore
                        const value = +event.target.value;

                        if (Number.isInteger(value) === false || Number.isNaN(value)) {
                          customProjectsUser[project.project.id].mark = 0;
                          event.preventDefault();
                          return;
                        }
                        customProjectsUser[project.project.id].mark = Math.min(125, Math.max(customProjectsUser[project.project.id].mark, 0))
                      }}
                    />
                  {/if}
                  {#if customProjectsUser[project.project.id].mark !== 0 }
                    <Badge color="yellow"  class="w-24">
                      {((customProjectsUser[project.project.id].mark / 100) * project.project.experience).toLocaleString()} XP
                    </Badge>
                  {:else}

                    {#if calculateCustomMarkForPoolGainedExperience(project) > 0}
                      <Badge color="yellow" class="w-24">
                        {calculateCustomMarkForPoolGainedExperience(project).toLocaleString()} XP
                      </Badge>
                      {:else}
                      <Badge color="dark" class="w-24">
                        {calculateProjectExperience(project).toLocaleString()} XP
                      </Badge>
                    {/if}
                  {/if}
                {:else}
                  <Badge color="dark" class="w-24">
                    {calculateProjectExperience(project).toLocaleString()} XP
                  </Badge>
                {/if}
              </div>
            </div>
          </div>
        </div>

        {#if project.childrenProjects.length}
          <div class="text-xs mt-0.5 mx-3 flex flex-col gap-1" style="width: calc(100% - 0.75rem);">
            {#each project.childrenProjects as cp}
              <div class="flex items-center gap-2  justify-between w-full  ">
                <div class="flex gap-2  items-center">
                  <Indicator color={projects[cp.id] ? "green" : "red"} />
                  {cp.name} 
                </div>
                
                {#if cp.experience > 0}
                  <div>
                    {#if  projects[cp.id]?.xp > 0}
                      <Badge color="green">
                        {projects[cp.id].mark}
                      </Badge>

                      <Badge color="green" class="w-24">
                        {projects[cp.id].xp} XP
                      </Badge>
                    {:else}
                      {#if customProjectsUser[cp.id]}
                        <input 
                        type="text" 
                        class="siminput text-sm dark:bg-gray-600 dark:text-white text-black bg-gray-100"
                        bind:value={customProjectsUser[cp.id].mark}
                        on:input={event => {
                          //@ts-ignore
                          const value = +event.target.value;

                          if (Number.isInteger(value) === false || Number.isNaN(value)) {
                            customProjectsUser[cp.id].mark = 0;
                            event.preventDefault();
                            return;
                          }
                          customProjectsUser[cp.id].mark = Math.min(125, Math.max(customProjectsUser[cp.id].mark, 0))
                        }}
                        />
                        {#if customProjectsUser[cp.id].mark > 0}
                          <Badge color="yellow" class="w-24">
                            {((customProjectsUser[cp.id].mark / 100) * cp.experience).toLocaleString()} XP
                          </Badge>
                          {:else}
                            <Badge color="dark" class="w-24">
                              {cp.experience} XP
                            </Badge>
                        {/if}

                      {/if}

                      <!-- {:else}

                      <Badge color="dark">
                        {cp.experience.toLocaleString()} XP
                      </Badge> -->
                    {/if}
                  </div>
                {/if}
            </div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</Card>

<style lang="scss">
  .siminput {
    border: none;
    outline: none;
    border-radius: 5px;
    width: 50px;
    height: 21px;
    text-align: center;
  }

</style>