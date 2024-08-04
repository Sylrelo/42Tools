<script lang="ts">

import { userSession } from "../../services/http";
import { navigate } from "svelte-routing";

export let showLabel: boolean = false;

export let suplClass: string = "";
</script>

<a
    href="##"
    class="flex gap-1 px-4 rounded items-center text-red-500 {suplClass} text-lg"
    on:click={(evt) => {
        evt.preventDefault()
        userSession.set(null);
        window.localStorage.clear();
        navigate("/");
    }}
>
    <i class="ti ti-logout text-xl md:text-lg"></i>
    {#if showLabel}
        Logout
    {/if}
</a>