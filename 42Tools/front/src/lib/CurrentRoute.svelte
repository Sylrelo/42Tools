<script lang="ts">
    import { useLocation } from "svelte-routing";
    import { currentLocation } from "../stores/global";

    const location = useLocation();

    $: if ($location) {
        currentLocation.set($location);
    }
</script>