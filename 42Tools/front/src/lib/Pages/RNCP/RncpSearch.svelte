<script lang="ts">
  import type { CachedRncpProgress } from "@back/src/modules/rncp-progress/rncp-progress.entity";

  import type { RncpDefinition } from "@back/src/modules/rncp-definition/rncp-definition.entity";
  import dayjs from "dayjs";
  import { Avatar, Badge, Button, Input, Label, Select, Toggle } from "flowbite-svelte";
  import { onMount } from "svelte";
  import { navigate } from "svelte-routing";
  import { httpGet, userSession } from "../../../services/http";
  import Paginator from "../../Paginator.svelte";

  import ArrowRightSolid from "flowbite-svelte-icons/ArrowRightSolid.svelte";
  import { showTimeLeft } from "./utils";

  import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
  import IsSameOrBefore from "dayjs/plugin/IsSameOrBefore";
  import RncpSearchAlternateView from "./RncpSearchAlternateView.svelte";
  dayjs.extend(isSameOrAfter);
  dayjs.extend(IsSameOrBefore);

  ///

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

  let alternativeView: boolean = false;
  let editMode: boolean = false;

  let filterOptions = {
    hideCompleted: false,
    showApprenticeOnly: false,
    selectedStartDate: null,
    selectedEndDate: null,
  };

  let tableSort = {
    key: "totalProgress",
    orderDesc: true,
  };

  let campusList: any[] = [];

  onMount(async () => {
    loadFilters();

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
  $: if (editMode === true && alternativeView === false) {
    alternativeView = true;
  }

  $: [alternativeView] && saveFilters();

  $: [
    page,
    searchQuery,
    selectedRncpId,
    filterOptions.hideCompleted,
    filterOptions.selectedStartDate,
    filterOptions.selectedEndDate,
  ] && filterResults();

  function filterResults() {
    saveFilters();
    const totalPages = Math.ceil(rncpProgress.length / PER_PAGE);

    if (
      (filterOptions.selectedStartDate || filterOptions.selectedEndDate) &&
      filterOptions.showApprenticeOnly === false
    ) {
      filterOptions.showApprenticeOnly = true;
    }

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

      const isAfterStartDate = filterOptions.selectedStartDate
        ? dayjs(filterOptions.selectedStartDate).isSameOrAfter(rp.user.apprenticeshipStartDate)
        : true;

      const isBeforeEndDate = filterOptions.selectedEndDate
        ? dayjs(filterOptions.selectedEndDate).isSameOrBefore(rp.user.apprenticeshipEndDate)
        : true;

      // console.log();
      const showOnlyCurrentRncp = filterOptions.showApprenticeOnly
        ? rp.user.apprenticeshipRncp === rp.rncp.rncpKey
        : true;

      return (
        hasQuery &&
        isRncpSelected &&
        removeCompleted &&
        showApprenticeOnly &&
        isBeforeEndDate &&
        isAfterStartDate &&
        showOnlyCurrentRncp
      );
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

  const FILTER_STORAGE_KEY = "RNCP_SEARCH_VIEWSETTINGS";

  function loadFilters() {
    setTimeout(() => {
      const asStr = localStorage.getItem(FILTER_STORAGE_KEY);

      if (asStr == null) {
        return;
      }

      const asJson = JSON.parse(asStr);

      filterOptions = asJson.filterOptions;
      alternativeView = asJson.alternativeView;
    }, 60);
  }

  let _timeoutSaveFilter: any = null;

  function saveFilters() {
    clearTimeout(_timeoutSaveFilter);

    _timeoutSaveFilter = setTimeout(() => {
      const asStr = JSON.stringify({
        filterOptions,
        alternativeView: true,
      });

      localStorage.setItem(FILTER_STORAGE_KEY, asStr);
    }, 400);
  }

  $: console.log({ alternativeView });
</script>

<h5 class="text-3xl font-bold mb-4 flex justify-between">
  <div>RNCP Search</div>

  {#if $userSession?.isStaff === true || $userSession?.login === "slopez"}
    <Toggle class="mb-2" bind:checked={editMode}>Edit mode</Toggle>
  {/if}
</h5>

<!-- /* --------------------------------- FILTERS -------------------------------- */ -->

<h5 class="text-xl mb-4">View & filter</h5>
<div class="w-full mb-6 gap-2 flex flex-wrap items-center">
  <div class="flex-grow w-50">
    <Toggle class="mb-2" bind:checked={filterOptions.hideCompleted}>Hide completed</Toggle>
    <Toggle class="mb-2" bind:checked={filterOptions.showApprenticeOnly}>Show apprentice only</Toggle>
    <Toggle class="mb-2" bind:checked={alternativeView}>Alternative view</Toggle>
  </div>

  <div class="flex-grow w-40">
    <Label for="inp-login" class="block mb-2">Search login or name</Label>
    <Input size="md" id="inp-login" placeholder="" disabled={isLoading} bind:value={searchQuery} />
  </div>

  <div class="flex-grow w-20">
    <Label for="inpt-campus" class="block mb-2">Campus</Label>
    <Select
      size="md"
      id="inpt-campus"
      bind:value={selectedCampusId}
      items={[...campusList.map((c) => ({ name: c.name, value: c.id }))]}
    />
  </div>

  <div class="flex-grow" style:width="30%">
    <Label for="inpt-rncp" class="block mb-2">RNCP</Label>
    <Select
      id="inpt-rncp"
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

  <div class="flex-grow w-40">
    <Label for="inpt-date-start" class="block mb-2">Apprenticeship start date</Label>
    <Input type="date" id="inpt-date-start" bind:value={filterOptions.selectedStartDate} />
  </div>

  <div class="flex-grow w-40">
    <Label for="inpt-date-start" class="block mb-2">Apprenticeship end date</Label>
    <Input type="date" id="inpt-date-start" bind:value={filterOptions.selectedEndDate} />
  </div>
</div>

<!-- /* --------------------------------- CONTENT -------------------------------- */ -->

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

  <div class="mt-2 flex w-100 justify-end">
    <Paginator
      totalPage={Math.ceil(filteredPageCount / PER_PAGE)}
      currentPage={page + 1}
      on:pageChange={(newPage) => {
        page = newPage.detail - 1;
      }}
    />
  </div>

  {#if alternativeView}
    <RncpSearchAlternateView {filteredProgress} {rncpDefinition} onUpdate={() => makeRequest()} {editMode} />
  {:else}
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
              <div>
                <a
                  href="https://profile.intra.42.fr/users/{progress.user.login}"
                  target="_blank"
                  class="hover:underline"
                >
                  <i class="ti ti-link"></i>
                  {progress.user.login}
                </a>
              </div>
              <Badge color="dark">{progress.user.poolYear}</Badge>
            </div>
          </div>
        </div>

        <!-- <div class="flex"> -->
        <div class=" hidden lg:flex gap-1">
          {#if progress.user.apprenticeshipEndDate}
            <Badge color="dark">
              {progress.user.apprenticeshipRythm}
            </Badge>

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

        <div class="w-60 text-sm hidden md:block">{progress.rncp.option}</div>

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
  {/if}
</div>

<div class="mt-2 flex w-100 justify-end">
  <Paginator
    totalPage={Math.ceil(filteredPageCount / PER_PAGE)}
    currentPage={page + 1}
    on:pageChange={(newPage) => {
      page = newPage.detail - 1;
    }}
  />
</div>
