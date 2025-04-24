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
        let totalReps = 0;
        let totalVolume = 0;

        workouts.forEach((workout) => {
            let totalWeightLiftedPerSet = workout.weight * workout.reps;

            totalWeight += workout.weight;
            totalReps += workout.reps;

            totalVolume += totalWeightLiftedPerSet;

            if (workout.weight > PR) {
                PR = workout.weight;
            }
        });

        stats = [
            [
                {
                    title: "Total reps",
                    value: totalReps,
                    desc: "",
                    iconName: "champion",
                },
                {
                    title: "Total series",
                    value: workouts.length,
                    desc: "",
                    iconName: "champion",
                },
            ],
            [
                {
                    title: "(Kg)Volumen total",
                    value: totalVolume,
                    desc: new Date(workouts[0].createdAt).toLocaleDateString(),
                    iconName: "scale",
                },
            ],
            [
                {
                    title: "(Kg)Peso máximo",
                    value: PR,
                    desc: new Date(workouts[0].createdAt).toLocaleDateString(),
                    iconName: "champion",
                },
                {
                    title: "(Kg)Peso total",
                    value: totalWeight,
                    desc: "",
                    iconName: "scale",
                },
            ],
            [
                {
                    title: "(Kg)Peso Promedio/Rep",
                    value: parseFloat((totalVolume / totalReps).toFixed(2)),
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
