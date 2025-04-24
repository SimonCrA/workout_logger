<script lang="ts">
    import { workoutLog, exerciseSelected } from "../../store";
    import type { IWorkout } from "../../env.d.ts";
    import { onMount } from "svelte";

    import Icon from "./Icon.svelte";

    let { isAdvanced } = $props<{
        isAdvanced: boolean;
    }>();

    let workouts = $state<IWorkout[]>([]);
    let exercise = exerciseSelected.get();

    onMount(() => {
        const unsubscribeWorkout = workoutLog.subscribe((value) => {
            workouts = value.workouts.filter(
                (workout) => workout.exerciseId == exercise.id,
            );
        });

        return () => {
            unsubscribeWorkout();
        };
    });
</script>

{#if workouts.length === 0}
    <div class="flex flex-col items-center justify-center py-6 text-center">
        <Icon name="alert" class="w-16 h-16 opacity-30 mb-3" />
        <h3 class="font-semibold text-lg">
            No hay registros para este ejercicio
        </h3>
        <p class="text-sm opacity-70 mt-1">
            Para empezar agrega un peso y las repeticiones realizadas.
        </p>
    </div>
{:else}
    <div
        class={`overflow-x-auto ${isAdvanced ? "max-h-[30vh]" : "max-h-[40vh]"}`}
    >
        <table class="table table-zebra table-pin-rows">
            <!-- head -->
            <thead>
                <tr>
                    <th class="text-center">Nro</th>
                    <th class="text-center">Peso(Kg)</th>
                    <th class="text-center">Reps</th>
                </tr>
            </thead>
            <tbody>
                <!-- row 1 -->
                {#each workouts as workout, index}
                    <tr>
                        <th class="text-center">{index + 1}</th>
                        <td class="text-center">{workout.weight}</td>
                        <td class="text-center">{workout.reps}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
{/if}
