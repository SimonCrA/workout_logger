<script lang="ts">
    import type { IMuscle } from "../../env.d.ts";
    import { muscleView, muscleSelected } from "../../store";

    let selection = $state<string>("");

    // Reactive props using runes
    let { muscles } = $props<{
        muscles: IMuscle[];
    }>();

    function handleSelection() {
        muscleSelected.set(selection);
    }
</script>

<select
    class="select select-primary w-48"
    bind:value={selection}
    onchange={handleSelection}
>
    <option disabled selected>Selecciona un músculo</option>
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
