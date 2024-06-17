<script lang="ts">
  import type { CachedRncpProgress } from "@back/src/modules/rncp-progress/rncp-progress.entity";
  import type { Users } from "@back/src/modules/users/users.entity";

  import type { RncpDefinition } from "@back/src/modules/rncp-definition/rncp-definition.entity";
  import dayjs from "dayjs";
  import { Alert, Avatar, Badge, Button, Input, Label, Select, Toggle } from "flowbite-svelte";
  import { onMount } from "svelte";
  import { navigate } from "svelte-routing";
  import { httpGet, userSession } from "../../../services/http";
  import Paginator from "../../Paginator.svelte";

  import ArrowRightSolid from "flowbite-svelte-icons/ArrowRightSolid.svelte";
  import StudentsSettingsModal from "./StudentsSettingsModal.svelte";
  import { showTimeLeft } from "./utils";

  let rncpDefinition: RncpDefinition[] = [];
  let rncpProgress: CachedRncpProgress[] = [];
  let isLoading = true;

  let timeoutSearch: any = null;

  const PER_PAGE = 20;

  let filteredPageCount = 0;

  let pagination: any[] = [];
  let page = 0;
  let searchQuery = "";

  let filteredProgress: CachedRncpProgress[] = [];
  let selectedRncpId: any = -1;
  let selectedCampusId: number | null = $userSession?.campusId ?? null;

  let filterOptions = {
    hideCompleted: false,
    showApprenticeOnly: false,
  };

  let studentSettingModalOpen = false;

  let tableSort = {
    key: "totalProgress",
    orderDesc: true,
  };

  let campusList: any[] = [];

  onMount(async () => {
    isLoading = true;

    rncpDefinition = await httpGet("/rncp-definition");
    campusList = await httpGet("/campus");

    campusList = campusList.filter((c) => ["lyon", "paris", "nice"].includes(c.name.toLowerCase()));

    rncpDefinition = rncpDefinition.sort((a, b) => a.level - b.level);

    makeRequest();
  });

  function makeRequest() {
    clearTimeout(timeoutSearch);

    timeoutSearch = setTimeout(async () => {
      isLoading = true;
      rncpProgress = [];
      filterResults();

      let campusQuery = "";

      if (selectedCampusId != null) campusQuery += "campusId=" + selectedCampusId;

      rncpProgress = await httpGet("/rncp-progress?" + campusQuery);

      filterResults();
      isLoading = false;
    }, 250);
  }

  function getColor(percent: number) {
    if (percent >= 100) {
      return "green";
    }

    if (percent >= 50) {
      return "yellow";
    }

    return "red";
  }

  $: [selectedCampusId] && makeRequest();
  $: [page, searchQuery, selectedRncpId, filterOptions.hideCompleted] && filterResults();

  function filterResults() {
    const totalPages = Math.ceil(rncpProgress.length / PER_PAGE);

    for (let i = page; i < Math.min(page + 10, totalPages); i++) {
      pagination.push({ name: i + 1 });
    }

    pagination = pagination;

    filteredProgress = structuredClone(rncpProgress);

    filteredProgress.sort((a, b) => {
      return (b.totalProgress - a.totalProgress) * (tableSort.orderDesc ? 1 : -1);
    });

    filteredProgress = filteredProgress.filter((rp) => {
      const hasQuery =
        searchQuery.length >= 2
          ? rp.user.login.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase()) ||
            rp.user.fullName.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase())
          : true;

      const isRncpSelected =
        selectedRncpId !== -1
          ? rp.rncp.level === selectedRncpId.level && rp.rncp.option === selectedRncpId.option
          : true;

      const removeCompleted = filterOptions.hideCompleted ? rp.totalProgress < 100 : true;

      const showApprenticeOnly = filterOptions.showApprenticeOnly ? rp.user.apprenticeshipEndDate != null : true;

      return hasQuery && isRncpSelected && removeCompleted && showApprenticeOnly;
    });

    // if (filterOptions.showApprenticeOnly) {
    //   filteredProgress.sort((a, b) =>
    //     dayjs(a.user.apprenticeshipEndDate).diff(b.user.apprenticeshipEndDate, "seconds"),
    //   );
    // }

    filteredPageCount = filteredProgress.length;

    filteredProgress = filteredProgress.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  }

  function changeSort(key: string) {
    tableSort.key = key;
    tableSort.orderDesc = !tableSort.orderDesc;

    filterResults();
  }

  $: if (studentSettingModalOpen === false) {
    makeRequest();
  }
</script>

<h5 class="text-3xl font-bold mb-4 flex justify-between">
  <div>RNCP Search</div>

  {#if $userSession?.isStaff === true || $userSession?.login === "slopez"}
    <Button
      color="light"
      class="gap-2"
      on:click={() => {
        studentSettingModalOpen = true;
      }}
    >
      <i class="ti ti-settings text-lg" />
      <span> Students settings </span>
    </Button>
  {/if}
</h5>

<Alert color="indigo" class="mb-4 mt-2">
  <div class="font-bold">Information</div>

  - Apprenticeship status cannot be determined automatically for now, only by manual toggle (student or staff).<br />
  - Percentages calculation may change in the future.<br />
  - Page is still a work in progress. <br />
</Alert>

<h5 class="text-xl mb-4">View & filter</h5>
<div class=" w-full mb-6 gap-4 grid grid-cols-1 md:grid-cols-4">
  <div class="w-full">
    <Toggle class="mb-2" bind:checked={filterOptions.hideCompleted}>Hide completed</Toggle>
    <Toggle class="mb-2" bind:checked={filterOptions.showApprenticeOnly}>Show apprentice only</Toggle>
  </div>

  <div class="w-full">
    <Label for="large-input" class="block mb-2">Search login or name</Label>
    <Input size="md" id="large-input" placeholder="" disabled={isLoading} bind:value={searchQuery} />
  </div>

  <div class="w-full">
    <Label for="large-input" class="block mb-2">Campus</Label>
    <Select
      size="md"
      id="large-input"
      bind:value={selectedCampusId}
      items={[...campusList.map((c) => ({ name: c.name, value: c.id }))]}
    />
  </div>

  <div class="w-full">
    <Label for="large-input" class="block mb-2">RNCP</Label>
    <Select
      size="md"
      bind:value={selectedRncpId}
      items={[
        { name: "All", value: -1 },
        ...rncpDefinition.map((r, i) => ({
          name: `${r.level} - ${r.option}`,
          value: { level: r.level, option: r.option },
        })),
      ]}
    />
  </div>
</div>

<div class="flex flex-col gap-0.5">
  {#if isLoading}
    {#each new Array(10) as _}
      <div class="flex flex-row items-center justify-between gap-2 rounded bg-white dark:bg-gray-800 p-3 h-20">
        <div class="flex-grow h-2 dark:bg-gray-600 bg-gray-500 animate-pulse" />
        <div class="w-24 h-2 dark:bg-gray-600 bg-gray-500 animate-pulse rounded" />
        <div class="w-10 h-2 dark:bg-gray-600 bg-gray-500 animate-pulse rounded" />
        <div class="w-80 h-2 dark:bg-gray-600 bg-gray-500 animate-pulse rounded" />
        <div class="w-36 h-2 dark:bg-gray-600 bg-gray-500 animate-pulse rounded" />
        <div class="w-10 h-2 dark:bg-gray-600 bg-gray-500 animate-pulse rounded" />
      </div>
    {/each}
  {/if}

  {#each filteredProgress as progress (progress.id)}
    <div class="flex flex-row items-center justify-between gap-2 rounded bg-white dark:bg-gray-800 p-3">
      <div class="flex gap-3 flex-grow">
        {#if progress.user.profilePicture}
          <img src={progress.user.profilePicture} class="w-14 h-14 object-cover rounded-full" alt="avatar" />
        {:else}
          <Avatar class="w-14 h-14" />
        {/if}
        <div class="flex flex-col">
          <div class="font-bold">{progress.user.fullName}</div>
          <div class="flex gap-2">
            <div>{progress.user.login}</div>
            <Badge color="dark">{progress.user.poolYear}</Badge>
          </div>
        </div>
      </div>

      <!-- <div class="flex"> -->
      <div class="w-36 hidden lg:flex gap-1">
        {#if progress.user.apprenticeshipEndDate}
          {#if progress.user.apprenticeshipStartDate}
            <Badge color="green">
              {dayjs(progress.user.apprenticeshipEndDate).diff(progress.user.apprenticeshipStartDate, "years")}
            </Badge>
          {/if}

          <Badge class=" w-full" color="indigo">
            {showTimeLeft(progress.user.apprenticeshipEndDate)}
          </Badge>
        {/if}
      </div>

      <div class="w-10 text-center hidden md:block">{progress.rncp.level}</div>

      <div class="w-80 text-sm hidden md:block">{progress.rncp.option}</div>

      <div class="flex flex-col gap-0.5 w-36">
        <Badge color={getColor(progress.totalProgress)} class="text-lg w-full">
          {progress.totalProgress.toFixed(2)} %
        </Badge>
        <Badge color="none" title="Last updated at">
          {dayjs(progress.user.lastUpdatedAt).format("DD/MM/YYYY HH:mm")}
        </Badge>
      </div>

      <div>
        <Button
          size="xs"
          color="light"
          class="m-0 px-2"
          on:click={() => navigate("/rncp-progress/" + progress.user.id)}
        >
          <ArrowRightSolid size="lg" />
        </Button>
      </div>
      <!-- </div> -->
    </div>
  {/each}
</div>

<div class="mt-2">
  <Paginator
    totalPage={Math.ceil(filteredPageCount / PER_PAGE)}
    currentPage={page + 1}
    on:pageChange={(newPage) => {
      page = newPage.detail - 1;
    }}
  />
</div>

<StudentsSettingsModal bind:isOpen={studentSettingModalOpen} />
