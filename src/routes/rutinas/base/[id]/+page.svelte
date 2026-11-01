<script lang="ts">
	import { getExercise, prescriptionLabel } from '#lib/catalog/index.js';
	import ExerciseRow from '#lib/components/ExerciseRow.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const routine = $derived(data.routine);
	// La integridad del catálogo garantiza que cada ejercicio existe; el id es solo el último recurso.
	const rows = $derived(
		routine.exercises.map((entry) => ({ entry, exercise: getExercise(entry.exerciseId) }))
	);
</script>

<svelte:head>
	<title>{routine.name} · Workout Logger</title>
</svelte:head>

<a href="/rutinas/base" class="inline-block py-2 text-sm text-muted-foreground">← Rutinas base</a>
<h1 class="mt-2 text-2xl">{routine.name}</h1>
{#if data.group}
	<p class="mt-1 text-sm text-muted-foreground">{data.group.name}</p>
{/if}

<ol class="mt-6 divide-y" aria-label="Ejercicios de la rutina">
	{#each rows as { entry, exercise } (entry.exerciseId)}
		{#if exercise}
			<ExerciseRow {exercise} note={prescriptionLabel(entry)} />
		{:else}
			<li class="py-3">{entry.exerciseId} · {prescriptionLabel(entry)}</li>
		{/if}
	{/each}
</ol>

<!-- Una rutina base no se empieza ni se edita: se copia como rutina personalizada (GLOSSARY). -->
<Button href="/rutinas/nueva?base={routine.id}" size="lg" class="mt-6 w-full">
	Crear desde esta rutina
</Button>
