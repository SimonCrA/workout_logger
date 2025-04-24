<script lang="ts">
    import { exerciseSelected, workoutLog } from "../../store";
    import type { IExercise, IWorkout } from "../../env.d.ts";
    import { onMount } from "svelte";

    import WorkoutTable from "./WorkoutTable.svelte";
    import WorkoutInput from "./WorkoutInput.svelte";
    import Icon from "./Icon.svelte";

    let exercise = $state<IExercise>({});
    let reps = $state(0);
    let weight = $state(0);
    let isAdvanced = $state(false);
    let rir = $state(0);

    function handleRepsChange(newValue: number) {
        reps = newValue;
    }

    function handleWeightChange(newValue: number) {
        weight = newValue;
    }

    function handleDeleteWorkout() {
        const workoutLogDb = workoutLog.get();
        const thisWorkouts: IWorkout[] = [];
        const workouts: IWorkout[] = [];

        for (const workout of workoutLogDb.workouts) {
            if (workout.exerciseId === exercise.id) {
                thisWorkouts.push(workout);
            } else {
                workouts.push(workout);
            }
        }

        if (thisWorkouts.length > 0) thisWorkouts.pop();

        workoutLog.set({
            ...workoutLogDb,
            workouts: [...workouts, ...thisWorkouts],
        });
    }

    function handleSaveWorkout() {
        const workout: IWorkout = {
            reps,
            weight,
            exerciseId: exercise.id,
            userId: null,
            createdAt: new Date().toISOString(),
            rir: isAdvanced ? rir : -1,
        };

        const workoutLogDb = workoutLog.get();
        const workouts: IWorkout[] = [...workoutLogDb.workouts];
        workouts.push(workout);
        workoutLog.set({ ...workoutLogDb, workouts: workouts });
    }

    onMount(() => {
        const unsubscribe = exerciseSelected.subscribe((value) => {
            exercise = value;
        });

        return () => {
            unsubscribe();
        };
    });
</script>

<div class="space-y-6">
    <h1 class="text-2xl font-bold text-center">{exercise.name}</h1>
    <!-- Grid rows: label + input -->
    <div class="flex items-center justify-between w-full">
        <h2 class="text-xl font-semibold">Reps</h2>
        <WorkoutInput
            type="number"
            placeholder="10"
            joinClass="w-2/3"
            leftIcon="arrow_down"
            rightIcon="arrow_up"
            incInterval={1}
            value={reps}
            onChange={handleRepsChange}
        />
    </div>

    <div class="flex items-center justify-between w-full">
        <h2 class="text-xl font-semibold">Peso (Kg)</h2>
        <WorkoutInput
            type="number"
            placeholder="5"
            joinClass="w-2/3"
            leftIcon="arrow_down"
            rightIcon="arrow_up"
            incInterval={2.5}
            value={weight}
            onChange={handleWeightChange}
        />
    </div>

    <div>
        <span class="label-text">Opciones avanzadas</span>
        <input
            type="checkbox"
            class="toggle toggle-sm"
            bind:checked={isAdvanced}
        />
    </div>

    {#if isAdvanced}
        <div class="grid grid-cols-[6rem_1fr]">
            <div class="flex gap-2 items-center">
                <h2 class="text-xl font-semibold">RIR</h2>
                <div
                    class="tooltip tooltip-right"
                    data-tip="Reps in Reserve (Reps en reserva)"
                >
                    <Icon name="question" class="w-5 h-5" />
                </div>
            </div>

            <div class="flex gap-4 items-center">
                <h3>{rir}</h3>
                <input
                    type="range"
                    min="0"
                    max="5"
                    bind:value={rir}
                    class="range range-primary"
                />
            </div>
        </div>
    {/if}

    <div class="flex gap-4">
        <button
            class={`btn btn-primary flex-1 ${$workoutLog.workouts.find((w) => w.exerciseId === exercise.id) == null ? "btn-disabled" : ""}`}
            onclick={handleDeleteWorkout}
        >
            Borrar
        </button>

        <button
            class={`btn btn-primary flex-1 ${weight == 0 || reps == 0 ? "btn-disabled" : ""}`}
            onclick={handleSaveWorkout}
        >
            Guardar
        </button>
    </div>

    <WorkoutTable {isAdvanced} />
</div>
