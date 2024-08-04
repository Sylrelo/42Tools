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
        Navbar
    } from "flowbite-svelte";
    import { navigate } from "svelte-routing";
    import { userSession } from "../services/http";
    import NavLink from "./Component/NavLink.svelte";
</script>

<Navbar class="px-2 sm:px-4 py-2.5 fixed w-full z-20 top-0 start-0 border-b">
    <NavBrand href="/">
        <img src="/42_Logo-white.png" class="hidden md:inline me-3 h-6 sm:h-9 invert dark:invert-0"
             alt="Flowbite Logo" />
        <!--<span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">Tools </span>-->
    </NavBrand>

    <div class="flex h-10 order-2 md:gap-4">
        <DarkMode />
        <a
            href="##"
            class="flex  text-sm p-2.5 h-full rounded-lg items-center text-red-500"
            on:click={(evt) => {
                evt.preventDefault()
                userSession.set(null);
                window.localStorage.clear();
                navigate("/");
            }}
        >
            <i class="ti ti-logout text-lg"></i>
        </a>
        <NavHamburger />
    </div>

    <div class="flex h-10 md:gap-4 flex-grow md:flex-grow-0">
        <NavLink url="/" label="Stats" icon="chart-bar" />
        <NavLink url="/calculator" label="Calculator" icon="calculator" />

        <NavLink url="/rncp-progress" label="My RNCP" icon="certificate" />

        <div class="hidden md:flex md:gap-4">
            {#if $userSession?.campusId === 9}
                <NavLink url="/calendar" label="Calendar" icon="calendar" alwaysShowLabel />
            {/if}
            <NavLink url="/server-infos" label="About" icon="server" alwaysShowLabel />
        </div>
    </div>

    <NavUl divClass="w-full">
        {#if $userSession?.campusId === 9}
            <NavLink url="/calendar" label="Calendar" icon="calendar" alwaysShowLabel />
        {/if}
        <NavLink url="/server-infos" label="About" icon="server" alwaysShowLabel />
    </NavUl>
</Navbar>
