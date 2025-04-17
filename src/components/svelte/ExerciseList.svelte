<script lang="ts">
    import type { Exercise } from "../../env.d.ts";
    import Icon from "./Icon.svelte";

    let exercises: Exercise[] = [
        {
            name: "Bench Press",
            description: "levantamiento de pesas acostado en banco.",
            muscle: "chest",
        },
        {
            name: "Curl de biceps",
            description: "levantamiento de barra con los biceps",
            muscle: "biceps",
        },
        {
            name: "skull crushes",
            description: "levantamiento de barra con los triceps",
            muscle: "triceps_f",
        },
        {
            name: "Squat",
            description: "sentadillas con barra en espalda.",
            muscle: "quads",
        },
        {
            name: "Deadlift",
            description: "Peso muerto con barra",
            muscle: "hamstrings",
        },
    ];

    const handleChartClick = (exercise: Exercise) => {
        console.log("Chart clicked for:", exercise.name);
        // Your logic here
    };

    const handleNoteClick = (exercise: Exercise) => {
        console.log("Note add clicked for:", exercise.name);
        // Your logic here
    };
</script>

<ul class="list bg-base-100 rounded-box shadow-md">
    {#each exercises as exercise}
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
                    on:click={() => handleChartClick(exercise)}
                >
                    <Icon name="chart" class="w-8 h-8 cursor-pointer" />
                </button>
                <button
                    class="btn btn-ghost btn-circle"
                    on:click={() => handleNoteClick(exercise)}
                >
                    <Icon name="noteadd" class="w-8 h-8 cursor-pointer" />
                </button>
            </div>
        </li>
    {/each}
</ul>
