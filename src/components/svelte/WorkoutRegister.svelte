<script lang="ts">
    import { exerciseSelected, workoutLog } from "../../store";
    import type { IExercise, IWorkout } from "../../env.d.ts";
    import { onMount } from "svelte";
    import Icon from "./Icon.svelte";
    import WorkoutTable from "./WorkoutTable.svelte";
    import WorkoutInput from "./WorkoutInput.svelte";

    let exercise = $state<IExercise>({});
    let reps = $state(1);
    let weight = $state(2.5);

    function handleRepsChange(newValue: number) {
        reps = newValue;
    }

    function handleWeightChange(newValue: number) {
        weight = newValue;
    }

    function handleSaveWorkout() {
        const workout: IWorkout = {
            reps,
            weight,
            exerciseId: exercise.id,
            userId: null,
            createdAt: new Date().toISOString(),
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

<div class="flex flex-col items-center gap-4 mb-8">
    <h1 class="text-3xl font-bold pb-6">{exercise.name}</h1>

    <div class="flex items-center">
        <h2 class="text-xl font-bold">Reps</h2>
        <WorkoutInput
            leftIcon="arrow_down"
            rightIcon="arrow_up"
            joinClass=""
            incInterval={1}
            value={reps}
            onChange={handleRepsChange}
        />
    </div>

    <div class="flex items-center">
        <h2 class="text-xl font-bold">Peso(Kg)</h2>
        <WorkoutInput
            leftIcon="arrow_down"
            rightIcon="arrow_up"
            joinClass=""
            incInterval={2.5}
            value={weight}
            onChange={handleWeightChange}
        />
    </div>
    <button class="btn btn-primary" onclick={handleSaveWorkout}>Guardar</button>

    <WorkoutTable />
</div>
