<script lang="ts">
  import { Alert, Avatar, Badge, Button, Modal, Rating } from "flowbite-svelte";
  import EnterprisePreviewCard from "./EnterprisePreviewCard.svelte";
  import dayjs from "dayjs";
</script>

<div>
  <div class="text-2xl font-bold mb-4 flex justify-between">
    <div>Enterprises</div>

    <Button color="blue" class="rounded ">Add a new review</Button>
  </div>

  <Alert color="dark">
    blabla page to note entreprise and experiences (internship, contracts, apprenticeship...) <br />
    - Report review<br />
    - Optional anon <br />
    -
  </Alert>

  <div class="mb-4"></div>

  <div class="text-xl font-bold mb-2">Most recommended</div>
  <div class="flex gap-2 overflow-auto">
    <EnterprisePreviewCard />
    <EnterprisePreviewCard />
    <EnterprisePreviewCard />
  </div>

  <!-- <div class="text-xl font-bold mt-4 mb-2">Most despised</div>
  <div class="flex gap-4">
    <EnterprisePreviewCard />
    <EnterprisePreviewCard />
    <EnterprisePreviewCard />
    <EnterprisePreviewCard />
  </div> -->

  <div class="text-xl font-bold mt-4 mb-2">Recents review</div>
  <div class="flex gap-2 overflow-auto">
    <EnterprisePreviewCard />
    <EnterprisePreviewCard />
    <EnterprisePreviewCard />
  </div>

  <div class="text-xl font-bold mt-4 mb-2">List</div>

  <div>Table</div>
</div>

<Modal title="Full review of [ENTERPRISE NAME]" open={true} autoclose outsideclose size="md">
  <div class="flex flex-col gap-4">
    {#each new Array(14) as _}
      <div class="flex items-start gap-2">
        <div class="mt-1">
          <Avatar rounded />
        </div>
        <div>
          <div class="text-sm flex justify-between items-center">
            <div><b>Anonymous</b>, {dayjs().format()}</div>
            <div>
              <Rating rating={2.5} />
            </div>
          </div>
          <div class="mb-2">
            <Badge color="dark">contract type</Badge>
            <Badge color="dark">contract start year</Badge>
            <Badge color="dark">contract duration</Badge>
          </div>
          <Alert color="dark" border class="p-2 rounded">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque dictum enim eu mi ultricies fringilla.
            Fusce et maximus risus. Donec auctor sit amet odio in tristique. Aliquam elit lorem, sodales at elementum
            et, laoreet in arcu. Sed placerat posuere ligula pulvinar tempus. Quisque vehicula commodo nulla ut
            convallis. Proin sodales purus mauris, in suscipit urna auctor eu. Nulla lobortis elit eget odio imperdiet
            rhoncus. Morbi vehicula neque a lacinia malesuada. Cras cursus tincidunt arcu, at placerat erat tristique
            vel. Pellentesque at condimentum mauris. Suspendisse vitae ultrices nisi.
          </Alert>
        </div>
      </div>
    {/each}
  </div>
</Modal>
