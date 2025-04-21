<script lang="ts">
    import { workoutLog, exerciseSelected } from "../../store";
    import type { IWorkout } from "../../env.d.ts";
    import { onMount } from "svelte";
    import Icon from "./Icon.svelte";

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
    <div class="flex flex-col items-center justify-center p-8 text-center">
        <Icon name="alert" class="w-16 h-16 opacity-30 mb-3" />
        <h3 class="font-semibold text-lg">
            No hay registros para este ejercicio
        </h3>
        <p class="text-sm opacity-70 mt-1">
            Para empezar agrega un peso y las repeticiones realizadas.
        </p>
    </div>
{:else}
    <div class="max-h-[50vh] overflow-x-auto">
        <table class="table table-zebra table-pin-rows">
            <!-- head -->
            <thead>
                <tr>
                    <th>Nro</th>
                    <th>Peso(Kg)</th>
                    <th>Reps</th>
                </tr>
            </thead>
            <tbody>
                <!-- row 1 -->
                {#each workouts as workout, index}
                    <tr>
                        <th>{index + 1}</th>
                        <td>{workout.weight}</td>
                        <td>{workout.reps}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
{/if}
