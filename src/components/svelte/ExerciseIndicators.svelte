<script lang="ts">
    import { exerciseSelected, workoutLog } from "../../store";
    import type { IExercise, IWorkout } from "../../env.d.ts";
    import { onMount } from "svelte";

    import ExerciseStats from "./ExerciseStats.svelte";

    let workouts = $state<IWorkout[]>([]);
    let stats = $state<
        { title: string; value: number; desc: string; iconName: string }[][]
    >([]);

    let exercise = $state<IExercise>({
        name: "",
        id: 0,
        muscle: "",
        muscleCode: "",
        description: "",
    });

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

        let PR = 0;
        let totalWeight = 0;
        workouts.forEach((workout) => {
            totalWeight += workout.weight;
            if (workout.weight > PR) {
                PR = workout.weight;
            }
        });

        stats = [
            [
                {
                    title: "Máximo peso (Kg)",
                    value: PR,
                    desc: new Date(workouts[0].createdAt).toLocaleDateString(),
                    iconName: "champion",
                },
                {
                    title: "Peso total (Kg)",
                    value: totalWeight,
                    desc: "",
                    iconName: "dumbbell",
                },
            ],
        ];

        return () => {
            unsubscribeExercise();
            unsubscribeWorkout();
        };
    });
</script>

<div class="flex flex-col items-center justify-center">
    <div class="text-l text-center font-bold my-4">{exercise.name}</div>

    <ExerciseStats data={stats} />
</div>
