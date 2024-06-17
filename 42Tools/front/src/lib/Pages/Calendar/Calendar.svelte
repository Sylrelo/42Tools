<script lang="ts">
  import { onMount } from "svelte";
  import { httpGet } from "../../../services/http";
  import ical from "node-ical";
  import dayjs from "dayjs";
  import isBetween from "dayjs/plugin/isBetween";

  dayjs.extend(isBetween);

  import type { Users } from "@back/src/modules/users/users.entity";
  import { Alert, Avatar, Card, MultiSelect, Popover } from "flowbite-svelte";

  //
  const icals: any[] = [];
  let isLoading = true;
  let selectedCalendar: string[] = [];
  //

  async function getIcal(name: string, endpoint: string) {
    const Alternance_Avril_3J2J = await httpGet("/tunnel?url=" + endpoint);

    const asJson: any[] = Object.values(ical.parseICS(Alternance_Avril_3J2J));

    let filteredJson = asJson.filter((c) => c.summary !== "Entreprise");

    const finalFilteredJson = filteredJson.map((c) => ({
      start: dayjs(c.start),
      end: dayjs(c.end),
    }));

    icals.push({
      type: name,
      days: finalFilteredJson,
    });
  }

  const COLORS: { [key: string]: string } = {
    Avril_3J2J: "#E34A6F",
    Avril_2S1S: "#E34A6F",
    Janvier_2S1S: "#F7B2BD",
    Janvier_3J2J: "#F7B2BD",
    Octobre_2S1S: "#60A561",
    Octobre_3J2J: "#60A561",
  };

  let apprentices: Partial<Users>[] = [];

  onMount(async () => {
    apprentices = await httpGet("/users/apprentices");

    isLoading = true;

    const calendars = await httpGet("/calendar");

    for (const calendar of calendars) {
      await getIcal(calendar.name, calendar.url);
    }

    selectedCalendar = icals.map((c) => c.type);

    isLoading = false;

    getCurrentWeekApprentices();
  });

  $: if (selectedCalendar) {
    generateCalendar();
  }

  let calendar: any[] = [];

  function isSchoolDay(date: dayjs.Dayjs) {
    const type: string[] = [];

    for (const ical of icals.filter((c) => selectedCalendar.includes(c.type))) {
      const pouet = ical.days.some((day: any) => date.isBetween(day.start, day.end, undefined, "[)"));

      if (pouet) {
        type.push(ical.type);
      }
    }

    return type;
  }

  function generateCalendar() {
    const startOfYear = dayjs().startOf("year");

    calendar = [];

    for (let m = 0; m < 12; m++) {
      const days = [];

      let monthDate = startOfYear.set("month", m);
      const monthName = monthDate.format("MMMM");

      let startDay = monthDate.day() <= 1 ? monthDate.day() + 6 : monthDate.day() - 1;

      if (startDay < 7) {
        for (let i = 0; i < startDay; i++) days.push({ day: "-", active: false });
      }

      while (monthDate.month() === m) {
        const schoolDayType = isSchoolDay(monthDate);

        days.push({
          day: monthDate.date(),
          completeDate: monthDate,
          active: schoolDayType.length > 0,
          schoolDayType,
        });

        monthDate = monthDate.add(1, "day");
      }

      calendar.push({ monthName, days });
    }
  }

  let currentWeekRythm: string[] = [];
  function getCurrentWeekApprentices() {
    const tmpRythm: Set<string> = new Set();

    for (const ical of icals) {
      for (const day of ical.days) {
        console.log(ical.type, day);

        if (dayjs().isBetween(day.start, day.end, undefined, "[]")) {
          tmpRythm.add(ical.type);
        }
      }
    }

    console.log(tmpRythm);
    currentWeekRythm = Array.from(tmpRythm);
  }
</script>

<Alert class="mb-4">
  <h5 class="text-xl">Work in progress</h5>
  - Page is slow
</Alert>

<div>
  <Card class="my-2 mb-4 " size="none">
    <h5 class="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">Apprentices at school this week</h5>
    <div class="flex gap-2 mb-4 flex-wrap">
      {#each apprentices.filter((a) => a.apprenticeshipRythm && currentWeekRythm.includes(a.apprenticeshipRythm) && dayjs(a.apprenticeshipEndDate).isAfter(undefined) && dayjs(a.apprenticeshipStartDate).isBefore(undefined)) as apprentice}
        <img src={apprentice.profilePicture} alt={apprentice.login} class="w-14 h-14 object-cover rounded-full" />
      {/each}
    </div>
  </Card>

  <Card size="none" class="my-2 mb-4">
    <h5 class="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">Filter agenda</h5>
    {#key isLoading}
      <MultiSelect
        bind:value={selectedCalendar}
        items={icals.map((i) => ({
          value: i.type,
          name: i.type,
        }))}
      />
    {/key}
  </Card>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 my-2">
    {#each calendar as month}
      <Card>
        <div class="mb-4 font-bold text-gray-900 dark:text-white">
          {month.monthName}
        </div>
        <div class="grid grid-cols-7 gap-4 mb-2">
          <div class="text-center pb-2 pt-2">M</div>
          <div class="text-center pb-2 pt-2">T</div>
          <div class="text-center pb-2 pt-2">W</div>
          <div class="text-center pb-2 pt-2">F</div>
          <div class="text-center pb-2 pt-2">T</div>
          <div class="text-center pb-2 pt-2">S</div>
          <div class="text-center pb-2 pt-2">S</div>
        </div>
        <div class="grid grid-cols-7">
          {#each month.days as day}
            <div
              style="width:100%; "
              class="text-center pb-2 pt-2 relative"
              class:font-bold={day.active}
              class:bg-gray-200={day.active}
              class:dark:bg-gray-900={day.active}
              id={`${month.monthName}-${day.day}`}
            >
              {day.day}
              <div class="flex flex-col">
                {#each day.schoolDayType ?? [] as type}
                  <div style=" background-color: {COLORS[type]}; height: 1px;" class=" w-full"></div>
                {/each}
              </div>
            </div>
            {#if day.active && Array.isArray(day.schoolDayType)}
              <Popover title={day.schoolDayType.join(", ")} triggeredBy={`#${month.monthName}-${day.day}`}>
                <div class="flex gap-3">
                  {#each apprentices.filter((a) => day.schoolDayType.includes(a.apprenticeshipRythm) && dayjs(a.apprenticeshipEndDate).isAfter(day.completeDate) && dayjs(a.apprenticeshipStartDate).isBefore(day.completeDate)) as apprentice}
                    <img
                      src={apprentice.profilePicture}
                      alt={apprentice.login}
                      class="w-14 h-14 object-cover rounded-full"
                    />
                  {/each}
                </div>
              </Popover>
            {/if}
          {/each}
        </div>
      </Card>
    {/each}
  </div>
</div>
