<script lang="ts">
	import {
		getExercise,
		objectiveLabel,
		restLabel,
		type RoutineExercise
	} from '#lib/catalog/index.js';
	import ExerciseRow from '#lib/components/ExerciseRow.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const routine = $derived(data.routine);
	// La integridad del catálogo garantiza que cada ejercicio existe; el id es solo el último recurso.
	const rows = $derived(
		routine.exercises.map((entry) => ({ entry, exercise: getExercise(entry.exerciseId) }))
	);

	/** Lo que prescribe la rutina, en una línea: "3 × 8–12 · RIR 2 · 90 s". */
	function prescription(entry: RoutineExercise): string {
		return [
			objectiveLabel(entry),
			entry.rir === null ? null : `RIR ${entry.rir}`,
			entry.rest === null ? null : restLabel(entry.rest)
		]
			.filter((part) => part !== null)
			.join(' · ');
	}
</script>

<svelte:head>
	<title>{routine.name} · Workout Logger</title>
</svelte:head>

<a href="/rutinas" class="inline-block py-2 text-sm text-muted-foreground">← Rutinas</a>
<h1 class="mt-2 text-2xl">{routine.name}</h1>
{#if data.group}
	<p class="mt-1 text-sm text-muted-foreground">{data.group.name}</p>
{/if}
<p class="mt-2 text-muted-foreground">{routine.description}</p>

<ol class="mt-6 divide-y" aria-label="Ejercicios de la rutina">
	{#each rows as { entry, exercise } (entry.exerciseId)}
		{#if exercise}
			<ExerciseRow {exercise} note={prescription(entry)} />
		{:else}
			<li class="py-3">{entry.exerciseId}</li>
		{/if}
	{/each}
</ol>
