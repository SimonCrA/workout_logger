<script lang="ts">
    import type { IMuscle } from "../../env.d.ts";
    import { muscles, muscleSelected } from "../../store.ts";
    import { onMount } from "svelte";

    let musclesDb = $state<IMuscle[]>([]);

    onMount(async () => {
        const unnsubscribe = muscles.subscribe(async (muscle) => {
            if (muscle) {
                try {
                    const res = await fetch(`/api/muscles`);

                    if (res.ok) {
                        musclesDb = await res.json();
                    } else {
                        console.error(
                            "Failed to fetch exercises:",
                            await res.text(),
                        );
                    }
                } catch (error) {
                    console.error("Error fetching exercises:", error);
                }
            }
        });

        return () => {
            unnsubscribe();
        };
    });

    function handleMuscleSelect(muscleCode: string) {
        muscleSelected.set(muscleCode);
    }
</script>

<form class="filter">
    <input class="btn btn-square" type="reset" value="×" />
    {#each musclesDb as muscle}
        <input
            class="btn"
            type="radio"
            name="muscles"
            aria-label={muscle.name}
            value={muscle.code}
            onclick={() => handleMuscleSelect(muscle.code)}
            checked={$muscleSelected === muscle.code}
        />
    {/each}
</form>
