<script lang="ts">
    import { muscles, muscleSelected } from "../../store.ts";
    import type { IMuscle } from "../../env.d.ts";
    import { onMount } from "svelte";

    let musclesDb = $state<IMuscle[]>([]);

    onMount(async () => {
        const unnsubscribe = muscles.subscribe(async (muscles) => {
            if (!muscles) {
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
            } else {
                musclesDb = muscles;
            }
        });

        return () => {
            unnsubscribe();
        };
    });

    function handleMuscleSelect(muscleCode: string) {
        muscleSelected.set(muscleCode);
    }

    function handleDeselect() {
        muscleSelected.set("");
    }
</script>

<form class="filter flex max-w-full justify-center">
    <div class="flex overflow-x-auto space-x-2 pb-1">
        <input
            class="btn btn-square"
            type="reset"
            value="×"
            onclick={() => handleDeselect()}
        />
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
    </div>
</form>
