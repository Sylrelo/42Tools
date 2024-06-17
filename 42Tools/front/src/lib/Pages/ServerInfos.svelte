<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { httpGet } from "../../services/http";
  import {
    Alert,
    Badge,
    Card,
    Heading,
    P,
    Progressbar,
    Spinner,
    Table,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from "flowbite-svelte";
  import { fade } from "svelte/transition";
  import dayjs from "dayjs";

  let serverInfo: any = {
    pendingUpdate: {
      activeStudent: 0,
      inactiveStudent: 0,
    },
    requestLeft: 1,
    totalRequestPossible: 1,
    count: {
      users: 0,
      users_anonymized: 0,
      users_locations: 0,
      users_events: 0,
    },
  };
  let isLoading = true;

  let _interval: any;

  let requestUsagePercent = 0;

  onMount(async () => {
    serverInfo = await httpGet("/server-infos");
    isLoading = false;

    _interval = setInterval(async () => {
      const tmpOld = structuredClone(serverInfo);
      isLoading = true;

      try {
        serverInfo = await httpGet("/server-infos");
      } catch {
        serverInfo = tmpOld;
      } finally {
        await new Promise((r) => setTimeout(() => r(null), 750));
        isLoading = false;
      }
    }, 10 * 1000);
  });

  onDestroy(() => {
    clearInterval(_interval);
  });

  $: if (serverInfo) {
    requestUsagePercent =
      ((serverInfo.totalRequestPossible - serverInfo.requestLeft) / serverInfo.totalRequestPossible) * 100;
  }

  function getCountBadgeColor(count: number) {
    if (count === 0) {
      return "dark";
    }

    if (count > 100) {
      return "yellow";
    }

    if (count < 100) {
      return "green";
    }
  }

  function getProgressbarColor(percent: number) {
    if (percent >= 90) return "red";
    else if (percent >= 50) return "yellow";
    return "green";
  }
</script>

<div class="text-2xl font-bold mb-4">Debug informations</div>

<!-- {#if isLoading === false} -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <Card size="none">
    <h5 class="text-xl dark:text-white text-black font-bold mb-2 h-8 flex justify-between">
      Database content
      {#if isLoading}
        <div transition:fade={{ duration: 200 }}>
          <Spinner color="white" />
        </div>
      {/if}
    </h5>
    <Table class=" dark:border-gray-500 w-full">
      <TableBodyRow>
        <TableBodyCell>
          <div class="flex flex-col gap-1">
            <div>Users</div>
            <div class="ml-3">- Active pending update</div>
            <div class="ml-3">- Inactive pending update</div>
            <div class="ml-3">- Anonymized</div>
          </div>
        </TableBodyCell>
        <TableBodyCell class="text-right">
          <div class="flex flex-col gap-1">
            <div>
              <Badge color="dark" class="w-full font-bold">
                {serverInfo.count.users.toLocaleString()}
              </Badge>
            </div>
            <div>
              <Badge class="w-full" color={getCountBadgeColor(serverInfo.pendingUpdate.activeStudent)}>
                {serverInfo.pendingUpdate.activeStudent.toLocaleString()}
              </Badge>
            </div>
            <div>
              <Badge class="w-full" color={getCountBadgeColor(serverInfo.pendingUpdate.inactiveStudent)}>
                {serverInfo.pendingUpdate.inactiveStudent.toLocaleString()}
              </Badge>
            </div>
            <div>
              <Badge class="w-full" color="dark">
                {serverInfo.count.users_anonymized.toLocaleString()}
              </Badge>
            </div>
          </div>
        </TableBodyCell>
      </TableBodyRow>

      <TableBodyRow>
        <TableBodyCell>
          Users Events
          <P class="text-sm opacity-65">
            Participation to events.
            <br />
            RNCP progress calculation, stats
          </P>
        </TableBodyCell>
        <TableBodyCell class="text-right">
          <Badge color="dark" class="w-full font-bold">
            {serverInfo.count.users_events.toLocaleString()}
          </Badge>
        </TableBodyCell>
      </TableBodyRow>

      <TableBodyRow>
        <TableBodyCell>
          Users Locations
          <P class="text-sm opacity-65">
            Log history in cluster.
            <br />
            Logtime calculation, "active" users, stats
          </P>
        </TableBodyCell>
        <TableBodyCell class="text-right">
          <Badge color="dark" class="w-full font-bold">
            {serverInfo.count.users_locations.toLocaleString()}
          </Badge>
        </TableBodyCell>
      </TableBodyRow>
    </Table>
  </Card>

  <Card size="none">
    <h5 class="text-xl dark:text-white text-black font-bold mb-2 h-8 flex justify-between">API 42</h5>

    <div>
      <div class="flex justify-between px-1 mb-1">
        <div class="">Current hour usage</div>

        <div>
          <span class="font-bold">
            {(serverInfo.totalRequestPossible - serverInfo.requestLeft).toLocaleString()}
          </span>
          / {serverInfo.totalRequestPossible.toLocaleString()}
          <span>({requestUsagePercent.toFixed(1)} %)</span>
        </div>
      </div>

      <Progressbar
        color={getProgressbarColor(requestUsagePercent)}
        progress={Math.floor(requestUsagePercent)}
        size="h-5"
      />
    </div>
    <div class="text-sm mt-2 p-1">
      {#key requestUsagePercent}
        Usage should approximately be at a maximum of {(dayjs().minute() + 1) * 20} at {dayjs().format("HH:mm")}
      {/key}
    </div>
  </Card>
</div>
<!-- {/if} -->
