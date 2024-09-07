<script lang="ts">
  import {
    Avatar,
    Badge,
    Input,
    Select,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from "flowbite-svelte";
  import { formatDateDisplay, showTimeLeft } from "./utils";
  import type { CachedRncpProgress } from "@back/src/modules/rncp-progress/rncp-progress.entity";
  import { onMount } from "svelte";
  import { httpGet, httpPatch } from "../../../services/http";
  import type { RncpDefinition } from "@back/src/modules/rncp-definition/rncp-definition.entity";
  import type { Users } from "@back/src/modules/users/users.entity";

  //

  export let editMode: boolean = false;
  export let filteredProgress: CachedRncpProgress[];
  export let rncpDefinition: RncpDefinition[];
  export let onUpdate: () => void;

  //
  let apprenticeshipRythm: string[] = [];

  //

  onMount(async () => {
    apprenticeshipRythm = await httpGet("/apprenticeship");
  });
  //

  function getColor(percent: number) {
    if (percent >= 100) {
      return "green";
    }
    if (percent >= 90) {
      return "blue";
    }

    if (percent >= 50) {
      return "yellow";
    }

    return "red";
  }

  async function updateUserData(
    student: Users,
    event: Event,
    key: "apprenticeshipEndDate" | "apprenticeshipStartDate" | "apprenticeshipRythm" | "apprenticeshipRncp",
  ) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;

    try {
      let value: any = target.value;

      if (typeof value === "string" && value.length === 0) {
        value = null;
      }

      await httpPatch("/users", student.id, { [key]: value });
    } catch (error: any) {
      // getStudentList();
      alert(error?.message);
    } finally {
      onUpdate();
    }
  }
</script>

<Table hoverable={true}>
  <TableHead>
    <TableHeadCell class="w-14 p-0"></TableHeadCell>
    <TableHeadCell class="p-0">Login</TableHeadCell>
    <TableHeadCell class="w-32 p-2">Start date</TableHeadCell>
    <TableHeadCell class="w-32 p-2">End date</TableHeadCell>
    <TableHeadCell class="w-40 p-2">Rythm</TableHeadCell>
    <TableHeadCell class="w-72 p-2">Certificate</TableHeadCell>
    <TableHeadCell class="p-2">Days left</TableHeadCell>
    <TableHeadCell class="p-2 text-right"></TableHeadCell>
    <TableHeadCell class="w-22 p-2 text-right">Progress</TableHeadCell>
  </TableHead>
  <TableBody>
    {#each filteredProgress as progress (progress.id)}
      <TableBodyRow>
        <TableBodyCell tdClass="p-2">
          {#if progress.user.profilePicture}
            <img src={progress.user.profilePicture} class="w-10 h-10 object-cover" alt="avatar" />
          {:else}
            <Avatar class="w-10 h-10" />
          {/if}
        </TableBodyCell>
        <TableBodyCell tdClass="p-0">
          <div class="font-bold">{progress.user.fullName}</div>
          <a href="https://profile.intra.42.fr/users/{progress.user.login}" target="_blank" class="hover:underline">
            <i class="ti ti-link"></i>
            {progress.user.login}
          </a>
        </TableBodyCell>
        <TableBodyCell tdClass="p-2">
          {#if editMode}
            <Input
              type="date"
              bind:value={progress.user.apprenticeshipStartDate}
              disabled={!editMode}
              size="sm"
              on:change={(e) => updateUserData(progress.user, e, "apprenticeshipStartDate")}
            />
          {:else}
            {formatDateDisplay(progress.user.apprenticeshipStartDate)}
          {/if}
        </TableBodyCell>
        <TableBodyCell tdClass="p-2">
          {#if editMode}
            <Input
              type="date"
              bind:value={progress.user.apprenticeshipEndDate}
              disabled={!editMode}
              size="sm"
              on:change={(e) => updateUserData(progress.user, e, "apprenticeshipEndDate")}
            />
          {:else}
            {formatDateDisplay(progress.user.apprenticeshipEndDate)}
          {/if}
        </TableBodyCell>
        <TableBodyCell tdClass="p-2">
          {#if editMode}
            <Select
              items={[{ name: "None", value: null }, ...apprenticeshipRythm.map((a) => ({ name: a, value: a }))]}
              bind:value={progress.user.apprenticeshipRythm}
              on:change={(e) => updateUserData(progress.user, e, "apprenticeshipRythm")}
              disabled={!editMode}
              size="sm"
            />
          {:else}
            {progress.user.apprenticeshipRythm ?? "--"}
          {/if}
        </TableBodyCell>
        <TableBodyCell tdClass="p-2">
          {#if editMode}
            <Select
              items={[
                { name: "None", value: null },
                ...rncpDefinition.map((r, i) => ({
                  name: `${r.level} - ${r.option}`,
                  value: r.rncpKey,
                })),
              ]}
              bind:value={progress.user.apprenticeshipRncp}
              on:change={(e) => updateUserData(progress.user, e, "apprenticeshipRncp")}
              disabled={!editMode}
              size="sm"
            />
          {:else}
            {progress.user.apprenticeshipRncp ?? "--"}
          {/if}
        </TableBodyCell>

        <TableBodyCell tdClass="p-2">
          {showTimeLeft(progress.user.apprenticeshipEndDate)}
        </TableBodyCell>

        <TableBodyCell tdClass="p-2 items-end flex flex-col gap-1">
          <div class="flex gap-1">
            <Badge color={getColor(progress.levelProgress)} title={`Level ${progress.levelProgress.toFixed(0)}%`}>
              L
            </Badge>
            <Badge color={getColor(progress.eventProgress)} title={`Events ${progress.eventProgress.toFixed(0)}%`}>
              E
            </Badge>
          </div>
          <div class="flex gap-1">
            {#each progress.blocksProgress as blockProgress}
              <Badge color={getColor(blockProgress)} title={`${blockProgress.toFixed(0)}%`}>&nbsp;</Badge>
            {/each}
          </div>
        </TableBodyCell>

        <TableBodyCell tdClass="p-2 text-right">
          <Badge color={getColor(progress.totalProgress)} class="text-lg">
            {progress.totalProgress.toFixed(2)} %
          </Badge>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>

<style lang="scss"></style>
