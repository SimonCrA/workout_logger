<script lang="ts">
	import { goto } from '$app/navigation';
	import { exerciseName, getExercise, type LoadMode } from '#lib/catalog/index.js';
	import MoveWorkoutDialog from '#lib/components/MoveWorkoutDialog.svelte';
	import SetEditor from '#lib/components/SetEditor.svelte';
	import SetList from '#lib/components/SetList.svelte';
	import * as AlertDialog from '#lib/components/ui/alert-dialog/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { entryDuration, entryEnd } from '#lib/log/history.js';
	import { formatDate, formatTime, workoutModeLine, workoutTitle } from '#lib/log/labels.js';
	import { live } from '#lib/log/live.svelte.js';
	import { liveBodyWeights } from '#lib/log/profile.js';
	import { bodyWeightAt } from '#lib/log/profile-rules.js';
	import { personalRecords } from '#lib/log/records.js';
	import { groupByExercise, type SetChanges } from '#lib/log/rules.js';
	import { deleteSet, updateSet } from '#lib/log/sets.js';
	import type { WorkoutSet } from '#lib/log/types.js';
	import { deleteWorkout, liveWorkoutDetail, moveWorkout } from '#lib/log/workouts.js';
	import { requestSync } from '#lib/sync/runtime.svelte.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// El entrenamiento con sus series, vivo desde IndexedDB; `null` si no existe o se borró.
	const entry = live(() => liveWorkoutDetail(data.id));
	const title = $derived(entry.value ? workoutTitle(entry.value.workout) : 'Entrenamiento');
	// Los récords de cada ejercicio salen de todas sus series, con el peso corporal de cada fecha.
	const bodyWeights = live(() => liveBodyWeights());
	const bodyWeightInForce = $derived(bodyWeightAt(bodyWeights.value ?? []));
	const recordsOf = (exerciseId: string, loadMode: LoadMode) =>
		personalRecords(entry.value?.exerciseSets[exerciseId] ?? [], loadMode, bodyWeightInForce).held;

	// Corregir el pasado (spec #18): una serie desde su fila, y el entrenamiento entero desde aquí.
	let editing = $state<WorkoutSet | null>(null);
	let editorOpen = $state(false);
	let askMove = $state(false);
	let askDelete = $state(false);
	let deleting = $state(false);

	function edit(set: WorkoutSet) {
		editing = set;
		editorOpen = true;
	}

	async function saveSet(set: WorkoutSet, changes: SetChanges) {
		const saved = await updateSet(set.id, changes);
		if (!saved)
			throw new Error('Esta serie se borró desde otro dispositivo: ya no se puede corregir.');
		requestSync();
	}

	async function removeSet(set: WorkoutSet) {
		// Borrar lo ya borrado no es un error: la serie ya no está.
		await deleteSet(set.id);
		requestSync();
	}

	async function move(startedAt: Date) {
		await moveWorkout(data.id, startedAt);
		requestSync();
	}

	async function remove() {
		askDelete = false;
		deleting = true;
		try {
			await deleteWorkout(data.id);
			requestSync();
			await goto('/historial');
		} finally {
			deleting = false;
		}
	}
</script>

<svelte:head>
	<title>{title} · Workout Logger</title>
</svelte:head>

<a href="/historial" class="inline-block py-2 text-sm text-muted-foreground">← Historial</a>

{#if entry.value === undefined || bodyWeights.value === undefined || deleting}
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
		<!-- Los ejercicios en el orden en que se hicieron, cada uno con sus series; tocar una la corrige. -->
		<div class="mt-6 space-y-6">
			{#each groupByExercise(sets) as { exerciseId, sets: done } (exerciseId)}
				{@const name = exerciseName(exerciseId)}
				{@const loadMode = getExercise(exerciseId)?.loadMode ?? 'external'}
				<section>
					<h2 class="text-lg"><a href="/ejercicios/{exerciseId}">{name}</a></h2>
					<SetList
						sets={done}
						{loadMode}
						label="Series de {name}"
						heldRecords={recordsOf(exerciseId, loadMode)}
						onedit={edit}
					/>
				</section>
			{/each}
		</div>
	{/if}

	<div class="mt-8 flex flex-wrap gap-2">
		<Button variant="outline" onclick={() => (askMove = true)}>Cambiar fecha</Button>
		<Button variant="destructive" onclick={() => (askDelete = true)}>Borrar entrenamiento</Button>
	</div>

	<SetEditor bind:open={editorOpen} set={editing} onsave={saveSet} ondelete={removeSet} />
	<MoveWorkoutDialog
		bind:open={askMove}
		startedAt={workout.startedAt}
		endsAt={entryEnd(entry.value)}
		onmove={move}
	/>

	<AlertDialog.Root bind:open={askDelete}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>¿Borrar el entrenamiento?</AlertDialog.Title>
				<AlertDialog.Description>
					Desaparece con todas sus series, de Historial y de los indicadores, en todos tus
					dispositivos.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Conservar</AlertDialog.Cancel>
				<AlertDialog.Action variant="destructive" onclick={remove}>Borrar</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
{/if}
