<script lang="ts">
  import {
    Button,
    DarkMode,
    Dropdown,
    DropdownItem,
    NavBrand,
    NavHamburger,
    NavLi,
    NavUl,
    Navbar,
  } from "flowbite-svelte";
  import { navigate } from "svelte-routing";
  import { userSession } from "../services/http";
  import NavLink from "./Component/NavLink.svelte";
</script>

<Navbar class="px-2 sm:px-4 py-2.5 fixed w-full z-20 top-0 start-0 border-b">
  <NavBrand href="/">
    <img src="/42_Logo-white.png" class="me-3 h-6 sm:h-9 invert dark:invert-0" alt="Flowbite Logo" />
    <!-- <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">Tools </span> -->
  </NavBrand>

  <div class="flex md:order-2 gap-2">
    <DarkMode />
    <Button
      color="red"
      class="px-3 rounded-lg"
      pill
      outline
      on:click={() => {
        userSession.set(null);
        window.localStorage.clear();
        navigate("/");
      }}
    >
      <i class="ti ti-logout text-lg"></i>
    </Button>

    <NavHamburger />
  </div>

  <NavUl>
    <NavLink url="/" label="Stats" />
    <NavLink url="/calculator" label="Calculator" />

    {#if [1, 9, 41].includes($userSession?.campusId ?? 0)}
      <NavLi id="dropdown-rncp" class="cursor-pointer">RNCP</NavLi>
      <Dropdown triggeredBy="#dropdown-rncp" trigger="hover" placement="bottom">
        <DropdownItem
          href="#"
          on:click={(e) => {
            navigate("/rncp-progress");
            e.preventDefault();
          }}
        >
          My RNCP
        </DropdownItem>

        <DropdownItem
          href="#"
          on:click={(e) => {
            navigate("/rncp-search");
            e.preventDefault();
          }}
        >
          Search
        </DropdownItem>
      </Dropdown>
    {/if}


    {#if $userSession?.campusId === 9}
      <NavLink url="/calendar" label="Calendar" />
    {/if}
    <NavLink url="/server-infos" label="About" />
  </NavUl>
</Navbar>
