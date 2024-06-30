<script lang="ts">
  import { Button, Heading, P, Span, Spinner } from "flowbite-svelte";
  import { onMount } from "svelte";
  import { navigate } from "svelte-routing";
  import { LSK_CLIENTID_LOGIN, login, userError, userSession } from "../services/http";

  const searchParams = new URLSearchParams(window.location.search);
  const redirectCode = searchParams.get("code");

  onMount(() => {
    tryLogin();
  });

  let errorMessage: string = "";
  let isBusy = false;

  async function tryLogin() {
    if (redirectCode == null) return;

    try {
      isBusy = true;

      userError.set(null);

      const result = await login(redirectCode);

      userSession.set(result.userData);
      window.localStorage.setItem("sessionToken", result["accessToken"]);

      navigate("/");
    } catch (error: any) {
      errorMessage = error?.message;
      userSession.set(null);
      window.localStorage.removeItem("sessionToken");
    } finally {
      isBusy = false;
    }
  }
</script>

<div class="flex justify-center items-center h-screen w-full">
  {#if isBusy}
    <div class="flex gap-2 items-center">
      <Spinner size={8} color="white" />
      <Span class="text-3xl">in queue</Span>
    </div>
  {/if}

  {#if errorMessage}
    <div>
      <Heading>
        Login
        <Span underline decorationClass="decoration-8 decoration-red-400 dark:decoration-red-600">error</Span>
      </Heading>
      <P class="mt-4 mb-4">
        {errorMessage}
      </P>
      <Button color="red" on:click={() => window.location.reload()}>Retry</Button>
    </div>
  {/if}
</div>
