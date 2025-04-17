<script lang="ts">
    import type { Muscles } from "../../env.d.ts";
    import { muscleView, diagramFig } from "../../store";
    import { onDestroy } from "svelte";

    let selectedMuscle = $state<string>("");
    let view;
    let muscles;

    const unsubscribeView = muscleView.subscribe((value) => {
        view = value;
    });

    const unsubscribeDiagram = diagramFig.subscribe((value) => {
        muscles = value.muscles;
    });

    onDestroy(() => {
        unsubscribeView();
        unsubscribeDiagram();
    });

    function handleSelection() {
        let updatedMuscles = diagramFig.get().muscles;
        updatedMuscles.forEach((m: Muscles) => (m.isSelected = false));
        updatedMuscles.find(
            (m: Muscles) => m.value === selectedMuscle,
        ).isSelected = true;
        diagramFig.set({ ...diagramFig.get(), muscles: updatedMuscles });
    }
</script>

<select
    class="select select-primary w-48"
    bind:value={selectedMuscle}
    onchange={handleSelection}
>
    <option disabled selected>Selecciona un músculo</option>
    {#if $muscleView === "front"}
        {#each $diagramFig.muscles.filter((muscle) => muscle.view === "front") as muscle}
            <option value={muscle.value}>{muscle.name}</option>
        {/each}
    {:else}
        {#each $diagramFig.muscles.filter((muscle) => muscle.view === "back") as muscle}
            <option value={muscle.value}>{muscle.name}</option>
        {/each}
    {/if}
</select>
