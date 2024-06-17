<script lang="ts">
  import type { Users } from "@back/src/modules/users/users.entity";
  import { Avatar, Badge, Input, Label, Modal, Select, Spinner } from "flowbite-svelte";
  import { onMount } from "svelte";
  import { httpGet, httpPatch } from "../../../services/http";
  import { showTimeLeft } from "./utils";

  export let isOpen: boolean = true;

  let apprenticeshipRythm: string[] = [];

  let studentsList: Users[] = [];
  let filteredList: Users[] = [];
  let availablePoolYears: string[] = [];

  let filterOptions: Record<string, any> = {
    name: null,
    poolYear: null,
  };

  let isLoading: boolean = true;

  onMount(async () => {
    apprenticeshipRythm = await httpGet("/apprenticeship");

    getStudentList();
  });

  $: if ([studentsList, filterOptions]) {
    filteredList = studentsList.filter((s) => {
      const filterByLogin = filterOptions.name
        ? s.login.toLowerCase().includes(filterOptions.name.toLowerCase())
        : true;
      const filterByName = filterOptions.name
        ? s.fullName.toLowerCase().includes(filterOptions.name.toLowerCase())
        : true;

      const filterByPool = filterOptions.poolYear ? s.poolYear === filterOptions.poolYear : true;

      return (filterByName || filterByLogin) && filterByPool;
    });

    filteredList = filteredList.slice(0, 20);
  }

  async function getStudentList() {
    isLoading = true;
    studentsList = [];

    try {
      studentsList = await httpGet("/users/minimal");

      availablePoolYears = Array.from(new Set(studentsList.map((s) => s.poolYear) as string[]));
      availablePoolYears = availablePoolYears.sort((a, b) => +b - +a);
    } catch (error: any) {
      alert("Error " + error?.message);
    } finally {
      isLoading = false;
    }
  }

  async function updateDate(
    student: Users,
    event: Event,
    key: "apprenticeshipEndDate" | "apprenticeshipStartDate" | "apprenticeshipRythm",
  ) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;

    try {
      await httpPatch("/users", student.id, { [key]: target.value });
    } catch (error: any) {
      getStudentList();
      alert(error?.message);
    }
  }
</script>

<Modal title="Students customization" bind:open={isOpen} autoclose size="xl">
  <div class="flex gap-2 mb-4">
    <div class="flex-grow">
      <Label>Search by name, login</Label>
      <Input type="text" bind:value={filterOptions.name} placeholder="Login, name..." />
    </div>
    <div class="flex-grow">
      <Label>Pool year</Label>
      <Select
        items={[{ name: "All", value: null }, ...availablePoolYears.map((p) => ({ name: p, value: p }))]}
        bind:value={filterOptions.poolYear}
      />
    </div>
  </div>

  {#if isLoading}
    <div style="min-height: 400px; max-height:400px" class="flex justify-center items-center">
      <Spinner color="blue" />
    </div>
  {/if}
  <div class="flex flex-col gap-2" style="min-height: 400px; max-height:400px">
    {#each filteredList as student (student.id)}
      <div class="flex flex-row items-center gap-2 p-2">
        <div class="w-14">
          <img src={student.profilePicture} alt={student.login} class="w-14 h-14 object-cover rounded-full" />
        </div>
        <div class="flex-grow">
          <div class="font-bold">
            {student.fullName}
          </div>
          <div>
            <Badge color="indigo" class="text-sm">{student.poolYear}</Badge>
            {student.login}
          </div>
        </div>
        <div>
          <Select
            items={[{ name: "None", value: null }, ...apprenticeshipRythm.map((a) => ({ name: a, value: a }))]}
            bind:value={student.apprenticeshipRythm}
            on:change={(e) => updateDate(student, e, "apprenticeshipRythm")}
          />
        </div>
        <div class="w-72">
          <Input
            type="date"
            bind:value={student.apprenticeshipStartDate}
            on:change={(e) => updateDate(student, e, "apprenticeshipStartDate")}
          />
        </div>
        <div class="w-72">
          <Input
            type="date"
            bind:value={student.apprenticeshipEndDate}
            on:change={(e) => updateDate(student, e, "apprenticeshipEndDate")}
          />
        </div>
        <div class="w-28 text-right">
          {#if student.apprenticeshipEndDate}
            {showTimeLeft(student.apprenticeshipEndDate)}
          {:else}
            -
          {/if}
        </div>
      </div>
    {/each}
  </div>
</Modal>
