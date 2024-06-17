<script lang="ts">
  import { onMount } from "svelte";
  import { httpDelete, httpGet, httpPost, userSession } from "../../../../services/http";
  import type { RncpDefinitionInterface } from "@back/src/modules/rncp-definition/rncp-definition.service";
  import { Alert, Badge, Input, Modal, P, Spinner } from "flowbite-svelte";
  import type { Projects } from "@back/src/modules/projects/projects.entity";

  let rncpDefinition: RncpDefinitionInterface[] = [];
  let projects: Projects[] = [];
  let isLoading = false;

  let projectSearchFilterString: string = "";

  interface EditModal {
    addChildren: boolean;
    rncpDefinitionProjectId: number | null | undefined;
    currentProject: Projects | null;
    rncpId: number | null | undefined;
  }

  const editModal: EditModal = {
    addChildren: false,
    rncpDefinitionProjectId: null,
    currentProject: null,
    rncpId: null,
  };

  onMount(async () => {

    if($userSession?.isStaff === false && $userSession?.login !== "slopez") {
      return;
    }

    isLoading = true;

    await loadDefinition();

    projects = await httpGet(`/projects`);

    isLoading = false;
  });

  async function loadDefinition() {
    rncpDefinition = await httpGet("/rncp-definition");
    rncpDefinition = rncpDefinition.sort((a, b) => a.level - b.level);
  }
</script>

<h5 class="text-3xl mb-4">Edit RNCP</h5>


{#if $userSession?.isStaff === false && $userSession?.login !== "slopez"}
  <Alert color="red" class="text-lg">
    You are not authorized to access this page.
  </Alert>
{/if}

<div class="flex flex-row flex-wrap gap-4 justify-center">
  {#if isLoading}
    <Spinner color="blue" />
  {/if}
  {#each rncpDefinition as rncp}
    <div class="flex-grow bg-white dark:bg-gray-800 p-3 rounded">
      <div class="text-xl font-bold">
        <Badge color="dark" class="text-xl">{rncp.level}</Badge>
        {rncp.option}
      </div>
      <div class="flex flex-col gap-1 ml-10">
        {#each rncp.sections as section}
          <div class="font-bold border-b-4 flex justify-between">
            <div class="flex-grow">
              {section.section}
            </div>

            <button
              class="w-10 text-center"
              on:click={() => {
                editModal.rncpId = section.id;
              }}
            >
              <i class="ti ti-plus text-xl text-green-500" />
            </button>
          </div>
          <div class="flex flex-col gap-1 flex-wrap">
            {#each section.projects ?? [] as project}
              <div class="">
                <div class="px-2 py-1 flex flex-row justify-between hover:bg-gray-100 hover:dark:bg-gray-700">
                  <div class="flex-grow">
                    <Badge color="indigo" class="w-14">{project.project.id}</Badge>
                    {project.project.name}
                  </div>

                  <button
                    class="w-10 text-center"
                    on:click={() => {
                      editModal.rncpId = section.id;
                      editModal.currentProject = project.project;

                      editModal.rncpDefinitionProjectId = project.id;
                      editModal.addChildren = true;
                    }}
                  >
                    <i class="ti ti-plus text-xl text-green-500" />
                  </button>

                  <button
                    class="w-8 text-center"
                    on:click={async () => {
                      await httpDelete(`/rncp-definition/project/${project.id}`);
                      loadDefinition();
                    }}
                  >
                    <i class="ti ti-trash text-xl text-red-500" />
                  </button>
                </div>
                <div class="pl-8 pr-2 flex flex-col gap-0.5">
                  {#each project.childrenProjects as cproject}
                    <div class="flex flex-row justify-between">
                      <div>
                        <Badge color="indigo" class="w-14">{cproject.id}</Badge>
                        {cproject.name}
                      </div>

                      <button
                        class="w-8 text-center"
                        on:click={async () => {
                          await httpDelete(`/rncp-definition/children-project/${project.id}/${cproject.id}`);
                          loadDefinition();
                        }}
                      >
                        <i class="ti ti-trash text-xl text-red-500" />
                      </button>
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>

<Modal open={editModal.rncpDefinitionProjectId != null || editModal.rncpId != null} title="Project search">
  <Input type="text" bind:value={projectSearchFilterString} placeholder="Search project..." />

  <div class="overflow-auto h-96 flex flex-col gap-2">
    Max 100 projects are showed.
    {#each projects.filter((p) => p.id.toString().includes(projectSearchFilterString) || p.name
          .toLowerCase()
          .includes(projectSearchFilterString.toLowerCase()))
          .slice(0, 100) as project (project.id)}
      <button
        class="hover:brightness-95 flex gap-2 bg-gray-100 dark:bg-gray-700 p-2 rounded justify-between"
        on:click={async () => {
          try {
            if (editModal.addChildren === false) {
              await httpPost(`/rncp-definition/${editModal.rncpId}/project`, {
                projectId: project.id,
              });
            } 
            
            if (editModal.addChildren === true && editModal.rncpDefinitionProjectId != null) {
              await httpPost("/rncp-definition/project/" + editModal.rncpDefinitionProjectId, {
                childrenProjectId: project.id,
              });
            }

            await loadDefinition();

            editModal.addChildren = false;
            editModal.currentProject = null;
            editModal.rncpDefinitionProjectId = null;
            editModal.rncpId = null;
          } catch (error) {
            console.error(error);
          }
        }}
      >
        <Badge color="none" class="text-md w-20 text-right">#{project.id}</Badge>
        <div class="font-bold flex-grow text-left">{project.name}</div>
        <Badge color="yellow" class="text-md">{project.experience} XP</Badge>
      </button>
    {/each}
  </div>
</Modal>
