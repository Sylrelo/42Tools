<script lang="ts">
  import { Button, Heading, Spinner } from "flowbite-svelte";

  import { LSK_CLIENTID_LOGIN, getRedirectUri, httpGet } from "../services/http";
  import { onMount } from "svelte";

  let clientId: string;
  let isLoading: boolean = true;

  onMount(async () => {
    isLoading = true;
    try {
      clientId = await httpGet("/api-client-login");

      if (clientId == null) {
        return;
      }

      window.localStorage.setItem(LSK_CLIENTID_LOGIN, clientId);
    } catch (error) {
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="flex justify-center items-center h-screen">
  <div class="flex flex-col justify-center items-center">
    <Heading class="mb-4">42Tools</Heading>

    {#if isLoading}
      <Spinner class="h-10" color="white" />
    {:else}
      <Button href={getRedirectUri(clientId)} color="light" class="w-full" disabled={clientId == null}>Login</Button>
    {/if}
  </div>
</div>
