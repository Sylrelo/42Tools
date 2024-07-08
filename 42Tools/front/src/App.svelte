<script lang="ts">
  import { Button, Footer, FooterLink, FooterLinkGroup, Heading, Span } from "flowbite-svelte";
  import { Route, Router } from "svelte-routing";
  // import { DarkMode } from "flowbite-svelte";

  import { onMount } from "svelte";
  import "./bg-gradient.scss";
  import AuthRedirect from "./lib/AuthRedirect.svelte";
  import Login from "./lib/Login.svelte";
  import Navbar from "./lib/Navbar.svelte";
  import Calculator from "./lib/Pages/Calculator/Calculator.svelte";
  import Calendar from "./lib/Pages/Calendar/Calendar.svelte";
  import EntrepriseHome from "./lib/Pages/Enterprise/EntrepriseHome.svelte";
  import Home from "./lib/Pages/Home/Home.svelte";
  import Rncp from "./lib/Pages/RNCP/RNCP.svelte";
  import RncpSearch from "./lib/Pages/RNCP/RncpSearch.svelte";
  import ServerInfos from "./lib/Pages/ServerInfos.svelte";
  import { httpGet, userError, userSession } from "./services/http";

  import "@tabler/icons-webfont/dist/tabler-icons.min.css";
  import EditRncp from "./lib/Pages/RNCP/Admin/EditRNCP.svelte";

  export let url = "";

  // ---

  onMount(async () => {
    try {
      const sessionToken = window.localStorage.getItem("sessionToken");

      if (sessionToken) {
        const tokenData = JSON.parse(atob(sessionToken.split(".")[1]));

        const userData = await httpGet("/users/me");

        userSession.set(userData ?? tokenData);
        userError.set(null);
      } else {
        userSession.set(null);
        userError.set(null);
      }
    } catch (error: any) {
      userSession.set(null);
      userError.set(error?.message ?? "Unknown error");
    }
  });
</script>

<main>
  {#if $userSession != null && $userError == null}
    <Navbar />
    <div class="mb-16" />
  {/if}

  <div class="container mx-auto p-6">
    <Router {url}>
      {#if $userSession != null}
        <Route path="/" component={Home} />
        <Route path="/rncp-progress/:id" let:params>
          <Rncp studentId={params.id} />
        </Route>

        <Route path="/rncp-progress" component={Rncp} />

        <Route path="/admin/rncp" component={EditRncp} />

        <Route path="/calculator" component={Calculator} />

        <Route path="/enterprises" component={EntrepriseHome} />

        <Route path="/rncp-search">
          <RncpSearch />
        </Route>
        <Route path="/calendar">
          <Calendar />
        </Route>
        <Route path="/server-infos"><ServerInfos /></Route>
      {:else if $userError != null}
        <div class="flex flex-col justify-center items-center h-screen">
          <div class="flex flex-col justify-center h-screen">
            <div>
              <Heading>
                <Span underline decorationClass="decoration-8 decoration-red-400 dark:decoration-red-600"
                  >Unauthorized</Span
                > access
              </Heading>
            </div>
            <div class="mt-4">Your session token has probably expired.</div>

            <Button
              color="light"
              class="w-full mt-2"
              on:click={() => {
                userError.set(false);
                userSession.set(null);
                window.location.replace("/");
              }}
            >
              Retry
            </Button>
            <!-- <Button class="mt-2" color="red" href="/">Retry</Button> -->
          </div>
        </div>
      {:else}
        <Route>
          <Login />
        </Route>
      {/if}

      <Route path="/auth-redirect">
        <AuthRedirect />
      </Route>
    </Router>

    <Footer class="mt-10">
      <FooterLinkGroup>
        <FooterLink
          href="https://github.com/Sylrelo/42Tools/issues/new/choose"
          target="_blank"
          aClass="flex items-center gap-2 hover:underline hover:brightness-150"
        >
          <img src="/github-mark.png" alt="github-logo" class="h-5 w-5 dark:invert" />
          Report an issue or request a feature
        </FooterLink>
      </FooterLinkGroup>
    </Footer>
  </div>
</main>

<style>
  :global(*) {
    font-family: "NotoSans";
  }
</style>
