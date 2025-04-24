<script lang="ts">
    import { muscleView, muscleSelected } from "../../store";
    import type { IMuscle } from "../../env.d.ts";

    let { muscles } = $props<{
        muscles: IMuscle[];
    }>();
</script>

<select class="select w-48" bind:value={$muscleSelected}>
    <option disabled selected value="">Selecciona un músculo</option>
    {#if $muscleView === "front"}
        {#each muscles.filter((muscle: IMuscle) => muscle.view === "front") as muscle}
            <option value={muscle.code}>{muscle.name}</option>
        {/each}
    {:else}
        {#each muscles.filter((muscle: IMuscle) => muscle.view === "back") as muscle}
            <option value={muscle.code}>{muscle.name}</option>
        {/each}
    {/if}
</select>
