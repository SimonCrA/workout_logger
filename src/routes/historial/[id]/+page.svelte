<script lang="ts">
	import { exerciseName, getExercise } from '#lib/catalog/index.js';
	import SetList from '#lib/components/SetList.svelte';
	import { entryDuration } from '#lib/log/history.js';
	import { formatDate, formatTime, workoutModeLine, workoutTitle } from '#lib/log/labels.js';
	import { live } from '#lib/log/live.svelte.js';
	import { groupByExercise } from '#lib/log/rules.js';
	import { liveWorkoutEntry } from '#lib/log/workouts.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// El entrenamiento con sus series, vivo desde IndexedDB; `null` si no existe o se borró.
	const entry = live(() => liveWorkoutEntry(data.id));
	const title = $derived(entry.value ? workoutTitle(entry.value.workout) : 'Entrenamiento');
</script>

<svelte:head>
	<title>{title} · Workout Logger</title>
</svelte:head>

<a href="/historial" class="inline-block py-2 text-sm text-muted-foreground">← Historial</a>

{#if entry.value === undefined}
	<p class="mt-4 text-muted-foreground">Cargando…</p>
{:else if entry.value === null}
	<h1 class="mt-2 text-2xl">No existe ese entrenamiento</h1>
	<p class="mt-2 text-muted-foreground">Puede que se haya borrado desde otro dispositivo.</p>
{:else}
	{@const { workout, sets } = entry.value}
	<header class="mt-2">
		<h1 class="text-2xl">{workoutTitle(workout)}</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			{formatDate(workout.startedAt)} · {formatTime(workout.startedAt)}
		</p>
		<p class="text-sm text-muted-foreground">
			{workoutModeLine(workout.mode, entryDuration(entry.value))}
		</p>
	</header>

	{#if sets.length === 0}
		<p class="mt-6 text-muted-foreground">Sin series.</p>
	{:else}
		<!-- Los ejercicios en el orden en que se hicieron, cada uno con sus series. -->
		<div class="mt-6 space-y-6">
			{#each groupByExercise(sets) as { exerciseId, sets: done } (exerciseId)}
				{@const name = exerciseName(exerciseId)}
				<section>
					<h2 class="text-lg"><a href="/ejercicios/{exerciseId}">{name}</a></h2>
					<SetList
						sets={done}
						loadMode={getExercise(exerciseId)?.loadMode ?? 'external'}
						label="Series de {name}"
					/>
				</section>
			{/each}
		</div>
	{/if}
{/if}
