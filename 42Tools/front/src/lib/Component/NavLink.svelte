<script lang="ts">
    import { navigate } from "svelte-routing";
    import { currentLocation } from "../../stores/global";

    export let url: string;
    export let label: string;

    export let icon: string = "";

    export let alwaysShowLabel = false;
</script>

<a href={url}
   class="px-4 h-full flex rounded items-center
         hover:text-black hover:dark:text-white hover:dark:bg-gray-800 hover:bg-gray-200
         {$currentLocation.pathname === url ? 'dark:bg-gray-800 bg-gray-200' : ''}
   "
   on:click={(e) => {
        navigate(url);
        e.preventDefault();
  }}


>
    <div class="text-lg">
        <i class="ti ti-{icon} text-2xl md:text-lg"></i>
        <span class={alwaysShowLabel ? "" : "hidden md:inline"}>
            {label}
        </span>
    </div>
</a>
