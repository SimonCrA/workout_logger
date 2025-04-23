<script lang="ts">
    import { exerciseSelected, workoutLog } from "../../store";
    import type { IExercise, IWorkout } from "../../env.d.ts";
    import { onMount } from "svelte";

    import WorkoutTable from "./WorkoutTable.svelte";
    import WorkoutInput from "./WorkoutInput.svelte";

    let exercise = $state<IExercise>({});
    let reps = $state(0);
    let weight = $state(0);

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

<div class="card w-full max-w-lg mx-auto space-y-6">
    <h1 class="text-2xl font-bold text-center">{exercise.name}</h1>

    <!-- Grid rows: label + input -->
    <div class="grid grid-cols-[6rem,1fr] items-center gap-4">
        <h2 class="text-xl font-semibold">Reps</h2>
        <WorkoutInput
            type="number"
            placeholder="10"
            joinClass="w-full"
            leftIcon="arrow_down"
            rightIcon="arrow_up"
            incInterval={1}
            value={reps}
            onChange={handleRepsChange}
        />
    </div>

    <div class="grid grid-cols-[6rem,1fr] items-center gap-4">
        <h2 class="text-xl font-semibold">Peso (Kg)</h2>
        <WorkoutInput
            type="number"
            placeholder="5"
            joinClass="w-full"
            leftIcon="arrow_down"
            rightIcon="arrow_up"
            incInterval={2.5}
            value={weight}
            onChange={handleWeightChange}
        />
    </div>

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

    <WorkoutTable />
</div>
