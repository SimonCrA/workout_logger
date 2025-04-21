<script lang="ts">
    import type { IExercise } from "../../env.d.ts";
    import Icon from "./Icon.svelte";
    import { muscleSelected, exerciseSelected } from "../../store";
    import { onMount } from "svelte";

    let exercisesDb = $state<IExercise[]>([]);

    onMount(async () => {
        const unnsubscribe = muscleSelected.subscribe(async (muscle) => {
            if (muscle) {
                try {
                    const res = await fetch(`/api/exercises?muscle=${muscle}`);

                    if (res.ok) {
                        exercisesDb = await res.json();
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

    const handleChartClick = (exercise: IExercise) => {
        window.location.href = `/exercises/${exercise.muscleCode}/stats`;
    };

    const handleNoteClick = (exercise: IExercise) => {
        exerciseSelected.set(exercise);
        window.location.href = `/exercises/${exercise.muscleCode}`;
    };
</script>

{#if exercisesDb.length === 0}
    <div class="flex flex-col items-center justify-center p-8 text-center">
        <Icon name="alert" class="w-16 h-16 opacity-30 mb-3" />
        <h3 class="font-semibold text-lg">No se encontraron ejercicios</h3>
        <p class="text-sm opacity-70 mt-1">
            Selecciona otro grupo muscular para ver ejercicios
        </p>
    </div>
{/if}
<ul class="list bg-base-100 rounded-box shadow-md">
    {#each exercisesDb as exercise}
        <li class="list-row flex justify-between">
            <div>
                <div>{exercise.name}</div>
                <div class="text-xs uppercase font-semibold opacity-60">
                    {exercise.description}
                </div>
            </div>
            <div class="flex gap-2">
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
                    <Icon name="noteadd" class="w-8 h-8 cursor-pointer" />
                </button>
            </div>
        </li>
    {/each}
</ul>
