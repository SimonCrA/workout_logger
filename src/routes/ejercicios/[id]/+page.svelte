<script lang="ts">
	import { untrack } from 'svelte';
	import {
		equipmentLabel,
		getMuscle,
		loadModeLabel,
		oppositeView,
		viewFor,
		type View
	} from '#lib/catalog/index.js';
	import BodyMap, { type Highlight } from '#lib/components/BodyMap.svelte';
	import ExerciseChart from '#lib/components/ExerciseChart.svelte';
	import ExerciseHistory from '#lib/components/ExerciseHistory.svelte';
	import ExerciseIndicators from '#lib/components/ExerciseIndicators.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import RestCounter from '#lib/components/RestCounter.svelte';
	import SetEditor from '#lib/components/SetEditor.svelte';
	import SetList from '#lib/components/SetList.svelte';
	import SetLogger from '#lib/components/SetLogger.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { exerciseIndicators } from '#lib/log/indicators.js';
	import { minuteClock } from '#lib/log/clock.svelte.js';
	import { lastTimeLine } from '#lib/log/labels.js';
	import { live } from '#lib/log/live.svelte.js';
	import { liveBodyWeights } from '#lib/log/profile.js';
	import { bodyWeightAt } from '#lib/log/profile-rules.js';
	import { restStart } from '#lib/log/companion.js';
	import {
		groupByWorkout,
		lastTime,
		nextSetMode,
		openWorkout,
		prefillFor,
		type SetChanges
	} from '#lib/log/rules.js';
	import { addSets, deleteLastSet, deleteSet, liveExerciseLog, updateSet } from '#lib/log/sets.js';
	import { DEFAULT_MODE, type WorkoutSet } from '#lib/log/types.js';
	import { requestSync } from '#lib/sync/runtime.svelte.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const exercise = $derived(data.exercise);
	const primary = $derived(getMuscle(exercise.primaryMuscle));
	const secondaries = $derived(
		exercise.secondaryMuscles.map((code) => getMuscle(code)?.name).filter((name) => name)
	);
	const highlights = $derived.by((): Record<string, Highlight> => ({
		...Object.fromEntries(exercise.secondaryMuscles.map((code) => [code, 'faint'])),
		[exercise.primaryMuscle]: 'strong'
	}));
	let view = $state<View>(untrack(() => (primary ? viewFor(primary, 'front') : 'front')));
	$effect(() => {
		if (primary) view = viewFor(primary, 'front');
	});

	// Registro: las series del ejercicio y el entrenamiento sin terminar, vivos desde IndexedDB.
	const log = live(() => liveExerciseLog(exercise.id));
	// El peso corporal, para el peso efectivo de corporal y asistido en su fecha.
	const bodyWeights = live(() => liveBodyWeights());
	const clock = minuteClock();
	const all = $derived(log.value?.sets ?? []);
	const currentId = $derived(openWorkout(log.value?.unfinished, clock.now)?.id);
	// Mientras carga no hay registro que dibujar; el modo real llega con la consulta.
	const mode = $derived(
		log.value ? nextSetMode(log.value.unfinished, log.value.lastMode, clock.now) : DEFAULT_MODE
	);
	// Lo que la rutina prescribe para este ejercicio; solo la tiene un entrenamiento con rutina, que siempre está en curso.
	const prescribed = $derived(log.value?.prescribed ?? null);
	// El descanso se compara con el sugerido para este ejercicio, que es el que toca.
	const restFrom = $derived(restStart(log.value?.unfinished, clock.now));
	const today = $derived(all.filter((set) => set.workoutId === currentId));
	const previous = $derived(lastTime(all, currentId));
	const history = $derived(groupByWorkout(all).filter((g) => g.workoutId !== currentId));
	const prefillReps = $derived(prefillFor(all).reps);
	const prefillWeight = $derived(prefillFor(all).weight);
	// Sin ningún peso corporal, los kilos de modo corporal y asistido quedan sin calcular.
	const bodyWeightInForce = $derived(bodyWeightAt(bodyWeights.value ?? []));
	const knowsBodyWeight = $derived((bodyWeights.value?.length ?? 0) > 0);
	const indicators = $derived(exerciseIndicators(all, exercise.loadMode, bodyWeightInForce));

	// Corregir una serie de hoy desde su fila (spec #18); "Borrar última" sigue siendo el atajo.
	let editing = $state<WorkoutSet | null>(null);
	let editorOpen = $state(false);

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
</script>

<svelte:head>
	<title>{exercise.name} · Workout Logger</title>
</svelte:head>

<a href="/ejercicios" class="inline-block py-2 text-sm text-muted-foreground">← Ejercicios</a>
<h1 class="mt-2 text-2xl">{exercise.name}</h1>

{#if log.value === undefined || bodyWeights.value === undefined}
	<p class="mt-4 text-muted-foreground">Cargando…</p>
{:else}
	{#if previous.length > 0}
		<p class="mt-2 text-sm text-muted-foreground" aria-label="Última vez">
			{lastTimeLine(previous, exercise.loadMode)}
		</p>
	{/if}

	<section class="mt-6 space-y-4">
		{#if restFrom !== null}
			<RestCounter lastSetAt={restFrom} suggested={prescribed?.rest ?? null} />
		{/if}
		{#key exercise.id}
			<SetLogger
				{exercise}
				{prefillReps}
				{prefillWeight}
				prefillRir={prescribed?.rir ?? null}
				{mode}
				onregister={async (set, count) => {
					await addSets(set, count);
					requestSync();
				}}
			/>
		{/key}
	</section>

	<section class="mt-8">
		<div class="flex items-center justify-between">
			<h2 class="text-lg">Hoy</h2>
			{#if today.length > 0}
				<Button
					variant="ghost"
					size="sm"
					onclick={async () => {
						await deleteLastSet(exercise.id);
						requestSync();
					}}
				>
					Borrar última
				</Button>
			{/if}
		</div>
		{#if today.length === 0}
			<p class="text-muted-foreground">Sin series todavía.</p>
		{:else}
			<SetList sets={today} loadMode={exercise.loadMode} label="Series de hoy" onedit={edit} />
		{/if}
	</section>
	<SetEditor bind:open={editorOpen} set={editing} onsave={saveSet} ondelete={removeSet} />

	<section class="mt-8">
		<h2 class="text-lg">Indicadores</h2>
		<div class="mt-3">
			<ExerciseIndicators {indicators} />
		</div>
	</section>

	<section class="mt-8">
		<h2 class="text-lg">Progreso</h2>
		<div class="mt-3">
			<ExerciseChart
				sets={all}
				startedAt={log.value.startedAt}
				loadMode={exercise.loadMode}
				bodyWeightAt={bodyWeightInForce}
				{knowsBodyWeight}
			/>
		</div>
	</section>

	<section class="mt-8">
		<h2 class="text-lg">Historial</h2>
		<ExerciseHistory groups={history} loadMode={exercise.loadMode} />
	</section>
{/if}

<section class="mt-8">
	<h2 class="text-lg">Sobre el ejercicio</h2>
	<p class="mt-2 text-muted-foreground">{exercise.description}</p>
	<dl class="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
		<dt class="text-muted-foreground">Equipo</dt>
		<dd>{equipmentLabel[exercise.equipment]}</dd>
		<dt class="text-muted-foreground">Modo de carga</dt>
		<dd>{loadModeLabel[exercise.loadMode]}</dd>
		<dt class="text-muted-foreground">Primario</dt>
		<dd>{primary?.name}</dd>
		<dt class="text-muted-foreground">Secundarios</dt>
		<dd>{secondaries.length > 0 ? secondaries.join(', ') : 'Ninguno'}</dd>
	</dl>
	<div class="mt-6 flex items-start justify-center gap-2">
		<div class="h-72 w-44">
			<BodyMap bind:view {highlights} label="Mini mapa" />
		</div>
		<Button
			variant="ghost"
			size="icon"
			aria-label="Girar el mapa"
			onclick={() => (view = oppositeView(view))}
		>
			<Icon name="refresh" class="size-5" />
		</Button>
	</div>
</section>
