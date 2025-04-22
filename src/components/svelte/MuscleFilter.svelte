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

    function handleDeselect() {
        muscleSelected.set("");
    }
</script>

<form class="filter">
    <div class="filter-container">
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

<style>
    .filter {
        width: 100%;
    }

    .filter-container {
        display: flex;
        flex-wrap: nowrap;
        overflow-x: auto;
        white-space: nowrap;
        padding-bottom: 8px; /* For scrollbar space */
        -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
    }

    .filter-container::-webkit-scrollbar {
        height: 4px;
    }

    .filter-container::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
    }

    .filter-container .btn {
        flex: 0 0 auto;
        margin-right: 4px;
    }
</style>
