<script lang="ts">
  import { NavLi } from "flowbite-svelte";
  import { navigate } from "svelte-routing";

  export let url: string;
  export let label: string;
</script>

<NavLi
  href={url}
  on:click={(e) => {
    navigate(url);
    e.preventDefault();
  }}
>
  {label}
</NavLi>
