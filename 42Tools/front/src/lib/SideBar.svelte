<script lang="ts">
  import { Alert, DarkMode, NavHamburger, NavLi, NavUl, Navbar, Sidebar, SidebarCta, SidebarGroup, SidebarItem, SidebarWrapper } from "flowbite-svelte";
  import { navigate } from "svelte-routing";
</script>

<!-- <Navbar rounded>
    <NavHamburger />
    <NavUl>
        <NavLi>Home</NavLi>
        <NavLi>Calculator</NavLi>
        <NavLi>RNCP</NavLi>
        <NavLi>Calendar</NavLi>
    </NavUl>
</Navbar> -->

<Sidebar activeUrl="">
  <SidebarWrapper>
    <SidebarGroup>
      <SidebarItem label="Home"></SidebarItem>
      <SidebarItem label="Calculator"></SidebarItem>
      <SidebarItem label="Cluster Matrix"></SidebarItem>
    </SidebarGroup>

    <SidebarGroup border>
      <SidebarItem
        label="RNCP"
        on:click={(e) => {
          navigate("/rncp-search");
          e.preventDefault();
        }}
      />
      <SidebarItem
        on:click={(e) => {
          navigate("/rncp");
          e.preventDefault();
        }}
        label="My RNCP"
      />

      <SidebarItem
        on:click={(e) => {
          navigate("/calendar");
          e.preventDefault();
        }}
        label="Calendar"
      />
      <Alert>alge</Alert>
    </SidebarGroup>

    <SidebarGroup border>
      <DarkMode />
    </SidebarGroup>
  </SidebarWrapper>
</Sidebar>
