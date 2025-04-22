<script lang="ts">
    import { exerciseSelected, workoutLog } from "../../store";
    import type { IExercise, IWorkout } from "../../env.d.ts";
    import { onMount } from "svelte";
    import Icon from "./Icon.svelte";

    let personalBest = $state(0);
    let series = $state(0);
    let prDate = $state("");
    let exercise = $state<IExercise>({
        name: "",
        id: 0,
        muscle: "",
        muscleCode: "",
        description: "",
    });

    let workouts = $state<IWorkout[]>([]);

    function calculatePR() {
        workouts.forEach((workout) => {
            if (workout.weight > personalBest) {
                personalBest = workout.weight;
            }
        });
    }

    onMount(() => {
        const unsubscribeExercise = exerciseSelected.subscribe((value) => {
            exercise = value;
        });

        const unsubscribeWorkout = workoutLog.subscribe((value) => {
            workouts = value.workouts;

            workouts = workouts.filter(
                (workout) => workout.exerciseId === exercise.id,
            );
        });

        calculatePR();
        series = workouts.length;
        prDate = new Date(workouts[0].createdAt).toLocaleDateString();

        return () => {
            unsubscribeExercise();
            unsubscribeWorkout();
        };
    });
</script>

<div class="text-l text-center font-bold my-4">{exercise.name}</div>
<div class="stats shadow">
    <div class="stat">
        <div class="stat-figure text-secondary">
            <Icon name="champion" class="h-6 w-6" />
        </div>
        <div class="stat-title">Más pesado</div>
        <div class="stat-value">{personalBest}</div>
        <div class="stat-desc">{prDate}</div>
    </div>

    <div class="stat">
        <div class="stat-figure text-secondary">
            <Icon name="dumbbell" class="h-6 w-6" />
        </div>
        <div class="stat-title">Series</div>
        <div class="stat-value">{series}</div>
    </div>
</div>
