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
    import LogoutButton from "./Component/LogoutButton.svelte";
</script>

<Navbar class="px-2 sm:px-4 py-2.5 fixed w-full z-20 top-0 start-0 border-b">
    <NavBrand href="/">
        <img src="/42_Logo-white.png" class="hidden md:inline me-3 h-6 sm:h-9 invert dark:invert-0"
             alt="Flowbite Logo" />
        <!--<span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">Tools </span>-->
    </NavBrand>

    <div class="flex h-10 order-2 md:gap-4">
        <DarkMode />
        <LogoutButton suplClass="hidden md:flex" />

        <!-- ONLY IN MOBILE -->
        <Button class="menuDropdown border-0 md:hidden" color="light" outline>
            <i class="ti ti-menu-2 text-lg"></i>
        </Button>

        <Dropdown triggeredBy=".menuDropdown" trigger="click" arrow>
             <DropdownItem>
                <NavLink url="/rncp-search" label="Show all RNCP" icon="list-details" alwaysShowLabel/>
            </DropdownItem>
            {#if $userSession?.campusId === 9}
                <DropdownItem><NavLink url="/calendar" label="Calendar" icon="calendar" alwaysShowLabel /></DropdownItem>
            {/if}
            <DropdownItem><NavLink url="/server-infos" label="About" icon="server" alwaysShowLabel /></DropdownItem>
            <DropdownItem>
                <LogoutButton showLabel />
            </DropdownItem>
        </Dropdown>
    </div>

    <div class="flex h-10 md:gap-4 flex-grow md:flex-grow-0">
        <NavLink url="/" label="Stats" icon="chart-bar" />
        <NavLink url="/calculator" label="Calculator" icon="calculator" />

        <NavLink url="/rncp-progress" label="My RNCP" icon="certificate" customCss="rncpDropdown"/>
        <Dropdown class="hidden md:block" triggeredBy=".rncpDropdown" trigger="hover" arrow>
            <DropdownItem>
                <NavLink url="/rncp-search" label="Show all" icon="list-details"/>
            </DropdownItem>
        </Dropdown>

        <div class="hidden md:flex md:gap-4">
            {#if $userSession?.campusId === 9}
                <NavLink url="/calendar" label="Calendar" icon="calendar" alwaysShowLabel />
            {/if}
            <NavLink url="/server-infos" label="About" icon="server" alwaysShowLabel />
        </div>
    </div>

    <!--<NavUl divClass="w-full">-->
    <!--    {#if $userSession?.campusId === 9}-->
    <!--        <NavLink url="/calendar" label="Calendar" icon="calendar" alwaysShowLabel />-->
    <!--    {/if}-->
    <!--    <NavLink url="/server-infos" label="About" icon="server" alwaysShowLabel />-->
    <!--</NavUl>-->
</Navbar>
