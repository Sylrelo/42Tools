<script lang="ts">
  import dayjs from "dayjs";
  import {
    Alert,
    Avatar,
    Badge,
    Card,
    Label,
    Select,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from "flowbite-svelte";
  import { onMount } from "svelte";
  import { Link } from "svelte-routing";
  import { httpGet, userSession } from "../../../services/http";
  import Paginator from "../../Paginator.svelte";
  import UserConnectionChart from "./UserConnectionChart.svelte";
  import UserOverLevel21Card from "./UserOverLevel21Card.svelte";
  import UserValidationTranscendence from "./UserValidationTranscendence.svelte";
  import RecentlyValidatedProjects from "./RecentlyValidatedProjects.svelte";
  // import { Campus } from "@back/src/modules/base/entities/campus";

  interface UserStat {
    index: number;
    user_id: number;
    user_login: string;
    user_full_name: string;
    user_pool_year: string | null;
    user_pool_level: number | null;
    user_profile_picture: any;
    user_campus_id: number;
    user_level: number;
    user_correction_point: number;
    user_wallet: number;
    user_validated_projects: number;
    user_events: number;
    user_last_updated_at: string | null;
  }

  interface AvailablePools {
    pool_month: string;
    pool_year: string;
  }

  // let availablePools: AvailablePools[] = [];

  let campusList: any[] = [];

  let availablePoolYears: number[] = [];
  let availablePoolMonthsPerYear = {};

  let userStats: UserStat[] = [];
  let userCount: number = 0;
  let timeTaken: number = 0;
  let selfPosition: number;

  let isLoadinguserStats = true;

  let oldSortKey = "";
  let querySettings: Record<string, any> = {
    key: "level",
    order: true,
    page: 1,
    poolYear: null,
    poolMonth: null,
    campusId: null,
  };

  onMount(async () => {
    const availablePools: AvailablePools[] = await httpGet("/users/available-pools");
    campusList = await httpGet("/campus");

    const tmpYearSet = new Set();
    const tmpMonthYear: any = {};

    for (const available of availablePools) {
      tmpYearSet.add(+available.pool_year);
      if (false === available.pool_year in tmpMonthYear) {
        tmpMonthYear[available.pool_year] = new Set();
      }
      tmpMonthYear[available.pool_year].add(available.pool_month);
    }

    for (const year in tmpMonthYear) {
      tmpMonthYear[year] = Array.from(tmpMonthYear[year]);
      tmpMonthYear[year] = tmpMonthYear[year].sort();
    }

    availablePoolYears = Array.from(tmpYearSet) as number[];
    availablePoolMonthsPerYear = tmpMonthYear;
  });

  $: if (querySettings.key || querySettings.page) {
    getUserListStats();
    oldSortKey = querySettings.key;
  }

  async function getUserListStats() {
    try {
      isLoadinguserStats = true;
      userStats = [];

      const q = new URLSearchParams();

      // if (querySettings.key === oldSortKey) {
      //   querySettings.order = !querySettings.order;
      // } else {
      //   querySettings.order = true;
      // }

      q.append("order", querySettings.order ? "DESC" : "ASC");
      q.append("sort", querySettings.key);
      q.append("page", querySettings.page.toString());

      if (querySettings.campusId) q.append("campus", querySettings.campusId);

      if (querySettings.poolYear !== null) q.append("poolYear", querySettings.poolYear);
      else {
        querySettings.poolMonth = null;
      }
      if (querySettings.poolMonth !== null) q.append("poolMonth", querySettings.poolMonth);

      // q.append("campus", "9");

      const response = await httpGet(`/users?${q.toString()}`);

      userStats = response.result;
      userCount = response.count;
      timeTaken = response.timeTaken;
      selfPosition = response.selfPosition >= 0 ? response.selfPosition + 1 : undefined;
    } catch (error) {
      console.error(error);
    } finally {
      isLoadinguserStats = false;
    }
  }
</script>

<h5 class="text-3xl font-bold mb-5">42 Global Ranking and Stats</h5>

<div>
  <Alert class="mb-4" color="yellow">
    <h5 class="text-xl font-bold mb-1">Informations</h5>
    <p class="text-md">This is still a work-in-progress, more stats will come.</p>
    <p class="text-md">
      At the time being, the data are still being fetched, check <Link to="/server-infos" class="underline"
        >about page</Link
      > for progression status.
    </p>
  </Alert>

  <!-- ################################################# -->

  {#if $userSession?.isPool !== true}
    <div class="mb-5 lg:gap-3 gap-2 grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1">
      <UserConnectionChart />
      <UserValidationTranscendence />
      <UserOverLevel21Card />

      <RecentlyValidatedProjects />
      <Card size="none" padding="xs">placeholder</Card>
      <Card size="none" padding="xs">Placeholder</Card>
    </div>
  {/if}


  <!-- ################################################# -->
  {#if $userSession?.isPool !== true}
    <div class="grid lg:grid-cols-3 gap-3">
      <div class="flex-grow">
        <Label class="block mb-0.5">Campus</Label>
        <Select
          items={[{ value: null, name: "All" }, ...campusList.map((c) => ({ name: c.name, value: c.id }))]}
          size="sm"
          class="w-full"
          bind:value={querySettings.campusId}
        />
      </div>

      <div class="flex-grow">
        <Label class="block mb-0.5">Pool year</Label>
        <Select
          on:change={() => {
            querySettings.page = 1;
            querySettings.poolMonth = null;
          }}
          items={[{ name: "All", value: null }, ...availablePoolYears.map((a) => ({ name: a, value: a }))]}
          size="sm"
          bind:value={querySettings.poolYear}
        />
      </div>

      <div class="flex-grow">
        <Label class="block mb-0.5">Pool month</Label>
        <Select
          items={[
            { name: "All", value: null },
            ...(availablePoolMonthsPerYear[querySettings.poolYear] ?? []).map((a) => ({ name: a, value: a })),
          ]}
          size="sm"
          bind:value={querySettings.poolMonth}
          disabled={querySettings.poolYear == null}
        />
      </div>
    </div>
  {/if}

  <!-- ################################################# -->

  <div>
    <div class="mb-5 mt-4">
      Your position with the currently selected filter/sort: <span class="font-bold">{selfPosition ?? "--"}</span> / {userCount.toLocaleString()}
      (page {Math.ceil(selfPosition / 20)})
    </div>

    <!-- ################################################# -->
    <div class=" flex-col gap-0.5 text-sm dark:bg-gray-700 bg-gray-300 py-2 hidden lg:flex">
      <div class="flex items-center gap-2 w-full">
        <div class="w-12 text-center">#</div>
        <div class="w-12 text-center"></div>
        <div class="text-center flex w-full gap-2 items-center justify-center lg:justify-end mt-4 lg:mt-0">
          <button
            class="w-24"
            on:click={() => {
              querySettings.key = "poolLevel";
            }}
          >
            Pool Level
          </button>
          <button
            class="w-24"
            on:click={() => {
              querySettings.key = "level";
            }}
          >
            Level
          </button>
          <button
            class="w-24"
            on:click={() => {
              querySettings.key = "wallet";
            }}
          >
            Wallets
          </button>
          <button
            class="w-24"
            on:click={() => {
              querySettings.key = "correctionPoint";
            }}
          >
            Correction Points
          </button>
          <button
            class="w-24"
            on:click={() => {
              querySettings.key = "projects";
            }}
          >
            Projects
          </button>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-0.5">
      {#each userStats as user (user.user_login)}
        <div
          class="flex-grow flex gap-2 dark:bg-gray-800 bg-gray-200 rounded flex-col items-start lg:flex-row lg:items-center py-3"
        >
          <div class="flex items-center gap-2 w-full">
            <div class="w-12 text-center" class:text-xs={user.index + 1 > 10000}>
              {(user.index + 1).toLocaleString()}
            </div>

            <div class="">
              <div class="flex gap-4 items-center">
                <div>
                  {#if user.user_profile_picture}
                    <img src={user.user_profile_picture} class="w-12 h-12 object-cover rounded-full" alt="avatar" />
                  {:else}
                    <Avatar class="w-12 h-12" />
                  {/if}
                </div>
                <div class="flex flex-col">
                  <div class="font-bold">{user.user_full_name}</div>
                  <div class="flex gap-1">
                    <div>{user.user_login}</div>

                    <Badge color="dark">
                      {user.user_pool_year ?? "unknown"}
                    </Badge>

                    {#if user.user_campus_id}
                      <Badge color="dark">
                        {campusList.find((c) => c.id === user.user_campus_id)?.name ?? `ID#${user?.user_campus_id}`}
                      </Badge>
                    {/if}
                  </div>
                  <!-- <div class="flex gap-2">
                    {#if user.user_campus_id}
                      <Badge color="dark">
                        {campusList.find((c) => c.id === user.user_campus_id)?.name ?? "--"}
                      </Badge>
                    {/if}
                    <Badge color="dark">
                      {user.user_pool_year ?? "unknown"}
                    </Badge>
                  </div> -->
                </div>
              </div>
            </div>
          </div>

          <div class="text-center flex w-full gap-2 items-center justify-center lg:justify-end mt-4 lg:mt-0">
            <div
              class="w-24"
              class:font-bold={querySettings.key === "poolLevel"}
              class:text-lg={querySettings.key === "poolLevel"}
            >
              <span class="lg:hidden mr-2">PL:</span>
              {user.user_pool_level?.toFixed(2) ?? "--"}
            </div>

            <div
              class="w-24"
              class:font-bold={querySettings.key === "level"}
              class:text-lg={querySettings.key === "level"}
            >
              <span class="lg:hidden mr-2">L:</span>
              {user.user_level?.toFixed(2) ?? "--"}
            </div>

            <div
              class="w-24"
              class:font-bold={querySettings.key === "wallet"}
              class:text-lg={querySettings.key === "wallet"}
            >
              <span class="lg:hidden mr-2">W:</span>
              {user.user_wallet?.toLocaleString() ?? "--"}
            </div>

            <div
              class="w-24"
              class:font-bold={querySettings.key === "correctionPoint"}
              class:text-lg={querySettings.key === "correctionPoint"}
            >
              <span class="lg:hidden mr-2">CP:</span>
              {user.user_correction_point?.toLocaleString() ?? "--"}
            </div>

            <div
              class="w-24"
              class:font-bold={querySettings.key === "projects"}
              class:text-lg={querySettings.key === "projects"}
            >
              <span class="lg:hidden mr-2">VP:</span>
              {user.user_validated_projects?.toLocaleString() ?? "--"}
            </div>
          </div>

          <!-- <div class="w-24 border">
            {user.user_last_updated_at ? dayjs(user.user_last_updated_at).format("DD/MM/YY HH:mm") : "--"}
          </div> -->
        </div>
      {/each}
    </div>

    <div class="m-4" />
    <Paginator
      currentPage={querySettings.page}
      totalPage={Math.floor(userCount / 20)}
      on:pageChange={(event) => {
        querySettings.page = event.detail;
      }}
    />
    <div class="m-4" />
  </div>

  <div class="mb-5">
    Queried {userCount.toLocaleString()} result in {timeTaken} ms.
  </div>
</div>
