<script lang="ts">
    import { muscleSelected, exerciseSelected } from "../../store";
    import type { IExercise } from "../../env.d.ts";
    import Icon from "./Icon.svelte";

    import { untrack } from "svelte";

    let exercisesDb = $state<IExercise[]>([]);
    let isLoading = $state(false);
    let error = $state<string | null>(null);
    let currentMuscle = $state<string | null>(null);

    async function fetchExercises(muscle: string | null) {
        // guard against re-fetching on the same muscle if you already have data
        if (muscle === currentMuscle && exercisesDb.length > 0) return;

        isLoading = true;
        error = null;
        currentMuscle = muscle;

        try {
            const url = muscle
                ? `/api/exercises?muscle=${muscle}`
                : "/api/exercises";

            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`Error ${res.status}: ${res.statusText}`);
            }
            exercisesDb = await res.json();
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "500: Internal Server Error";

            exercisesDb = [];
        } finally {
            isLoading = false;
        }
    }

    // This effect only depends on $muscleSelected
    $effect(() => {
        // read the store as a dependency…
        const muscle = $muscleSelected;
        // …but untrack all internal state changes inside fetchExercises
        untrack(() => {
            void fetchExercises(muscle);
        });
    }); // runs once on mount and then only when $muscleSelected changes :contentReference[oaicite:2]{index=2}

    // 4) click handlers (unchanged)
    function handleChartClick(ex: IExercise) {
        exerciseSelected.set(ex);
        window.location.href = `/exercises/${ex.muscleCode}/stats`;
    }

    function handleNoteClick(ex: IExercise) {
        exerciseSelected.set(ex);
        window.location.href = `/exercises/${ex.muscleCode}`;
    }
</script>

<div class="flex justify-center h-[calc(100vh-250px)]">
    {#if isLoading}
        <div class="flex flex-col items-center justify-center p-8 text-center">
            <span class="loading loading-spinner loading-lg"></span>
            <p class="mt-3">Cargando ejercicios...</p>
        </div>
    {:else if error}
        <div class="flex flex-col items-center justify-center p-8 text-center">
            <Icon name="error" class="w-16 h-16 text-error mb-3" />
            <h3 class="font-semibold text-lg">Error al cargar ejercicios</h3>
            <p class="text-sm opacity-70 mt-1">{error}</p>
        </div>
    {:else if exercisesDb.length === 0}
        <div class="flex flex-col items-center justify-center p-8 text-center">
            <Icon name="alert" class="w-16 h-16 opacity-30 mb-3" />
            <h3 class="font-semibold text-lg">No se encontraron ejercicios</h3>
            <p class="text-sm opacity-70 mt-1">
                Selecciona otro grupo muscular para ver ejercicios
            </p>
        </div>
    {:else}
        <ul class="list bg-base-100 overflow-y-auto">
            {#each exercisesDb as exercise}
                <li class="list-row flex justify-between">
                    <div>
                        <div>{exercise.name}</div>
                        <div class="text-xs uppercase font-semibold opacity-60">
                            {exercise.description}
                        </div>
                    </div>
                    <div class="list-col-grow flex gap-2">
                        <button
                            class="btn btn-ghost btn-circle"
                            onclick={() => handleChartClick(exercise)}
                        >
                            <Icon name="chart" class="w-8 h-8 cursor-pointer" />
                        </button>
                        <button
                            class="btn btn-ghost btn-circle"
                            onclick={() => handleNoteClick(exercise)}
                        >
                            <Icon
                                name="noteadd"
                                class="w-8 h-8 cursor-pointer"
                            />
                        </button>
                    </div>
                </li>
            {/each}
        </ul>
    {/if}
</div>
