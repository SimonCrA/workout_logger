<script lang="ts">
	import { untrack } from 'svelte';
	import {
		equipmentLabel,
		exerciseName,
		getMuscle,
		inactiveMuscles,
		loadModeLabel,
		objectiveLabel,
		prescriptionLabel,
		viewFor,
		type View
	} from '#lib/catalog/index.js';
	import BodyMap, { type Highlight } from '#lib/components/BodyMap.svelte';
	import ExerciseChart from '#lib/components/ExerciseChart.svelte';
	import ExerciseHistory from '#lib/components/ExerciseHistory.svelte';
	import ExerciseIndicators from '#lib/components/ExerciseIndicators.svelte';
	import ExerciseRecords from '#lib/components/ExerciseRecords.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import RestCounter from '#lib/components/RestCounter.svelte';
	import SegmentedSwitch from '#lib/components/SegmentedSwitch.svelte';
	import SetEditor from '#lib/components/SetEditor.svelte';
	import SessionComparison from '#lib/components/SessionComparison.svelte';
	import SetLogger from '#lib/components/SetLogger.svelte';
	import TodaySets from '#lib/components/TodaySets.svelte';
	import { exerciseIndicators, sessionComparison, toBeat } from '#lib/log/indicators.js';
	import { minuteClock } from '#lib/log/clock.svelte.js';
	import {
		formatKg,
		lastTimeLine,
		modeLabel,
		recordNotice,
		relativeDayLabel
	} from '#lib/log/labels.js';
	import { live } from '#lib/log/live.svelte.js';
	import { liveBodyWeights } from '#lib/log/profile.js';
	import { bodyWeightAt } from '#lib/log/profile-rules.js';
	import { personalRecords, recordsBrokenBy } from '#lib/log/records.js';
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
	import { followingExercise, nextSetLabel, objectiveMet } from '#lib/log/today.js';
	import {
		DEFAULT_MODE,
		WORKOUT_MODES,
		type WorkoutMode,
		type WorkoutSet
	} from '#lib/log/types.js';
	import { changeWorkoutMode, liveTodayLog } from '#lib/log/workouts.js';
	import { requestSync } from '#lib/sync/runtime.svelte.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const exercise = $derived(data.exercise);
	const primary = $derived(getMuscle(exercise.primaryMuscle));
	const secondaries = $derived(
		exercise.secondaryMuscles.map((code) => getMuscle(code)?.name).filter((name) => name)
	);
	const subtitle = $derived(
		[primary?.name, secondaries.join(', ')].filter((part) => part).join(' · ')
	);
	// En el mapa de Info, el primario en el azul de la app y los secundarios en su velo: el naranja
	// queda para el mapa de calor de Hoy, que significa series hechas.
	const highlights = $derived.by((): Record<string, Highlight> => ({
		...Object.fromEntries(exercise.secondaryMuscles.map((code) => [code, 'faint'])),
		[exercise.primaryMuscle]: 'strong'
	}));
	const inactive = inactiveMuscles();
	const views: { value: View; label: string }[] = [
		{ value: 'front', label: 'Frente' },
		{ value: 'back', label: 'Espalda' }
	];

	let view = $state<View>(untrack(() => (primary ? viewFor(primary, 'front') : 'front')));
	$effect(() => {
		if (primary) view = viewFor(primary, 'front');
	});

	type Tab = 'log' | 'indicators' | 'info';
	type IndicatorPart = 'summary' | 'records' | 'history' | 'totals';
	const indicatorParts: { value: IndicatorPart; label: string }[] = [
		{ value: 'summary', label: 'Resumen' },
		{ value: 'records', label: 'Récords' },
		{ value: 'history', label: 'Historial' },
		{ value: 'totals', label: 'Totales' }
	];
	let indicatorPart = $state<IndicatorPart>('summary');
	const tabs: { value: Tab; label: string }[] = [
		{ value: 'log', label: 'Registrar' },
		{ value: 'indicators', label: 'Indicadores' },
		{ value: 'info', label: 'Info' }
	];
	let tab = $state<Tab>('log');
	// Otro ejercicio vuelve a abrir en Registrar y, en Indicadores, en el Resumen.
	$effect(() => {
		void exercise.id;
		tab = 'log';
		indicatorPart = 'summary';
	});

	// Registro: las series del ejercicio y el entrenamiento sin terminar, vivos desde IndexedDB.
	const log = live(() => liveExerciseLog(exercise.id));
	// El entrenamiento entero, para el ejercicio que viene después en su rutina.
	const workout = live(() => liveTodayLog());
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
	const records = $derived(personalRecords(all, exercise.loadMode, bodyWeightInForce));
	// El Resumen de Indicadores: la última sesión frente a la anterior y lo que queda por superar.
	const comparison = $derived(
		sessionComparison(groupByWorkout(all), exercise.loadMode, bodyWeightInForce)
	);
	const targets = $derived(toBeat(records, comparison?.latest ?? null));
	const sessionWhen = $derived.by(() => {
		if (!comparison) return '';
		const day = relativeDayLabel(comparison.latest.date, clock.now);
		return day === 'Hoy' ? 'hoy' : day === 'Ayer' ? 'ayer' : 'la última vez';
	});

	// Volver lleva a Rutinas durante un entrenamiento y al buscador fuera de él.
	const back = $derived(
		currentId
			? { href: '/rutinas', label: 'Rutinas' }
			: { href: '/ejercicios', label: 'Ejercicios' }
	);

	// Hasta cumplir el objetivo de este ejercicio, el siguiente se ve pero no se abre.
	const met = $derived(objectiveMet(today, prescribed));
	// El que viene después en la rutina del entrenamiento en curso, fijo sobre las pestañas.
	const following = $derived.by(() => {
		const routine = workout.value?.routine;
		if (!routine || !openWorkout(workout.value?.unfinished, clock.now)) return null;
		return followingExercise(routine.exercises, workout.value?.sets ?? [], exercise.id);
	});

	// El aviso al batir un récord dura unos segundos; uno nuevo reemplaza al anterior. Lleva su
	// ejercicio porque la página se reutiliza al pasar a otro, y allí no se muestra.
	const NOTICE_MS = 6000;
	let notice = $state<{ exerciseId: string; text: string } | null>(null);
	$effect(() => {
		if (notice === null) return;
		const timer = setTimeout(() => (notice = null), NOTICE_MS);
		return () => clearTimeout(timer);
	});

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

	// El modo se cambia aquí también: con acompañamiento corre el descanso; sin entrenamiento en
	// curso, queda para el libre que nazca con la próxima serie.
	const modeOptions = WORKOUT_MODES.map((value) => ({ value, label: modeLabel[value] }));
	let modeBusy = $state(false);
	let modeError = $state<string | null>(null);

	async function pickMode(value: WorkoutMode) {
		if (value === mode) return;
		modeBusy = true;
		modeError = null;
		try {
			await changeWorkoutMode(value);
			requestSync();
		} catch {
			modeError = 'No se pudo cambiar el modo. Inténtalo otra vez.';
		} finally {
			modeBusy = false;
		}
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

<!-- La barra fija ocupa el ancho del <main> desde arriba del todo: el margen negativo deshace su relleno. -->
<header
	class="sticky top-0 z-10 -mx-6 -mt-10 border-b bg-background px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3"
>
	<div class="grid grid-cols-[5.5rem_minmax(0,1fr)_5.5rem] items-center gap-2">
		<a
			href={back.href}
			class="-ml-2 inline-flex min-h-11 items-center gap-0.5 justify-self-start px-2 text-sm text-muted-foreground"
		>
			<Icon name="chevron-right" class="size-4 rotate-180" />
			{back.label}
		</a>
		<div class="min-w-0 text-center">
			<h1 class="truncate text-base text-primary">{exercise.name}</h1>
			<p class="truncate text-xs text-muted-foreground">{subtitle}</p>
		</div>
	</div>
	<div class="mt-3">
		<SegmentedSwitch
			legend="Sección del ejercicio"
			name="exercise-tab"
			options={tabs}
			bind:value={tab}
		/>
	</div>
</header>

{#if tab === 'log'}
	{#if log.value === undefined || bodyWeights.value === undefined}
		<p class="mt-4 text-muted-foreground">Cargando…</p>
	{:else}
		<section aria-label="Registrar" class="mt-5 space-y-4">
			<div>
				<SegmentedSwitch
					legend="Modo"
					name="exercise-mode"
					options={modeOptions}
					value={mode}
					disabled={modeBusy}
					onchange={(value) => void pickMode(value)}
				/>
				{#if modeError}
					<p role="alert" class="mt-2 text-sm text-error-content">{modeError}</p>
				{/if}
			</div>
			<div class="flex items-center gap-4">
				{#if restFrom !== null}
					<RestCounter lastSetAt={restFrom} suggested={prescribed?.rest ?? null} variant="ring" />
				{:else if mode === 'companion'}
					<!-- Con acompañamiento y sin series todavía: el sitio del descanso, que arranca con la primera. -->
					<div
						class="flex size-24 shrink-0 flex-col items-center justify-center gap-0.5 rounded-full border-8 border-base-300 text-center"
					>
						<span class="text-xl leading-none text-muted-foreground">0:00</span>
						<span class="text-[10px] leading-tight text-muted-foreground">descanso</span>
					</div>
				{/if}
				<div class="min-w-0 space-y-1">
					<p class="text-xs tracking-wider text-muted-foreground uppercase">
						{nextSetLabel(today, prescribed)}
					</p>
					{#if prescribed}
						<p class="text-sm text-primary">Objetivo {prescriptionLabel(prescribed)}</p>
					{/if}
					{#if previous.length > 0}
						<p class="text-xs text-muted-foreground" aria-label="Última vez">
							{lastTimeLine(previous, exercise.loadMode)}
						</p>
					{/if}
					{#if mode === 'log'}
						<p class="text-xs text-muted-foreground">Solo registrar: sin contador de descanso.</p>
					{/if}
				</div>
			</div>

			{#key exercise.id}
				<SetLogger
					{exercise}
					{prefillReps}
					{prefillWeight}
					prefillRir={prescribed?.rir ?? null}
					onregister={async (set) => {
						const added = await addSets(set, 1);
						requestSync();
						// `all` puede traer ya las nuevas si la consulta viva llegó antes; recordsBrokenBy no las cuenta dos veces.
						const broken = recordsBrokenBy(all, added, exercise.loadMode, bodyWeightInForce);
						notice =
							broken.length > 0 ? { exerciseId: set.exerciseId, text: recordNotice(broken) } : null;
					}}
				/>
			{/key}
			{#if notice?.exerciseId === exercise.id}
				<p role="status" class="rounded-xl bg-primary px-3 py-2.5 text-sm text-base-200">
					<Icon
						name="champion"
						class="mr-1 inline size-4 align-text-bottom text-primary-foreground"
					/>
					{notice.text}
				</p>
			{/if}

			<TodaySets
				sets={today}
				{prescribed}
				loadMode={exercise.loadMode}
				heldRecords={records.held}
				onedit={edit}
				ondeletelast={async () => {
					await deleteLastSet(exercise.id);
					requestSync();
				}}
			/>
		</section>
	{/if}
{:else if tab === 'indicators'}
	{#if log.value === undefined || bodyWeights.value === undefined}
		<p class="mt-4 text-muted-foreground">Cargando…</p>
	{:else}
		<!-- Dentro de Indicadores, cuatro partes; el Resumen es lo que se mira entre series. -->
		<div role="tablist" aria-label="Partes de los indicadores" class="mt-5 flex gap-5 border-b">
			{#each indicatorParts as part (part.value)}
				<button
					type="button"
					role="tab"
					id="part-{part.value}"
					aria-selected={indicatorPart === part.value}
					aria-controls="panel-{part.value}"
					class={[
						'-mb-px min-h-11 border-b-[3px] text-sm transition-colors',
						indicatorPart === part.value
							? 'border-primary text-primary'
							: 'border-transparent text-muted-foreground'
					]}
					onclick={() => (indicatorPart = part.value)}
				>
					{part.label}
				</button>
			{/each}
		</div>

		<div
			role="tabpanel"
			id="panel-{indicatorPart}"
			aria-labelledby="part-{indicatorPart}"
			class="mt-5 space-y-5"
		>
			{#if indicatorPart === 'summary'}
				{#if comparison}
					<SessionComparison
						latest={comparison.latest}
						previous={comparison.previous}
						loadMode={exercise.loadMode}
						now={clock.now}
					/>
				{/if}

				<section aria-labelledby="progress-title" class="rounded-2xl border bg-white p-4">
					<h2 id="progress-title" class="mb-3 text-lg text-primary">Progreso</h2>
					<!-- Otro ejercicio vuelve a abrir en Todo y en su primera vista: el periodo no pasa de uno a otro. -->
					{#key exercise.id}
						<ExerciseChart
							now={clock.now}
							sets={all}
							startedAt={log.value.startedAt}
							loadMode={exercise.loadMode}
							bodyWeightAt={bodyWeightInForce}
							{knowsBodyWeight}
						/>
					{/key}
				</section>

				{#if targets.maxWeight || targets.repsAtWeight}
					<section aria-labelledby="to-beat-title" class="space-y-2.5">
						<h2 id="to-beat-title" class="text-lg text-primary">Para superar</h2>
						{#if targets.maxWeight}
							<div class="flex items-center justify-between gap-3 rounded-2xl bg-primary px-4 py-3">
								<span>
									<span class="block text-xs text-base-300">Peso máximo</span>
									<span class="block text-lg text-base-100">
										{formatKg(targets.maxWeight.kg)}{targets.maxWeight.reps === null
											? ''
											: ` × ${targets.maxWeight.reps}`}
									</span>
								</span>
								{#if targets.maxWeight.gap !== null}
									<span class="text-right text-xs text-primary-foreground">
										{targets.maxWeight.gap > 0
											? `te faltaron ${formatKg(targets.maxWeight.gap)} ${sessionWhen}`
											: `lo alcanzaste ${sessionWhen}`}
									</span>
								{/if}
							</div>
						{/if}
						{#if targets.repsAtWeight}
							<div
								class="flex items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3"
							>
								<span>
									<span class="block text-xs text-muted-foreground">
										Con {formatKg(targets.repsAtWeight.kg)}
									</span>
									<span class="block text-lg text-primary">
										{targets.repsAtWeight.record} reps
									</span>
								</span>
								<span class="text-right text-xs text-muted-foreground">
									{targets.repsAtWeight.done >= targets.repsAtWeight.record
										? `récord ${sessionWhen}`
										: `${sessionWhen} hiciste ${targets.repsAtWeight.done}`}
								</span>
							</div>
						{/if}
					</section>
				{/if}

				{#if !comparison}
					<p class="text-muted-foreground">
						Aquí verás cómo te fue frente a la vez anterior cuando registres series.
					</p>
				{/if}
			{:else if indicatorPart === 'records'}
				<!-- Sin aria-labelledby: la lista de récords ya se llama "Récords". -->
				<section>
					<h2 class="text-lg text-primary">Récords</h2>
					<div class="mt-3">
						<ExerciseRecords {records} />
					</div>
				</section>
			{:else if indicatorPart === 'history'}
				<section aria-labelledby="history-title">
					<h2 id="history-title" class="text-lg text-primary">Historial</h2>
					<div class="mt-3">
						<ExerciseHistory
							groups={history}
							loadMode={exercise.loadMode}
							heldRecords={records.held}
						/>
					</div>
				</section>
			{:else}
				<section aria-labelledby="totals-title">
					<h2 id="totals-title" class="text-lg text-primary">Totales</h2>
					<div class="mt-3">
						<ExerciseIndicators {indicators} {knowsBodyWeight} />
					</div>
				</section>
			{/if}
		</div>
	{/if}
{:else}
	<section aria-label="Info" class="mt-6 space-y-6">
		<!-- La misma tarjeta que el mapa de Hoy, más pequeña y en los tonos de la app, no en los del calor. -->
		<section aria-labelledby="muscles-title" class="rounded-2xl border bg-white p-3">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h2 id="muscles-title" class="text-lg text-primary">Músculos</h2>
				<!-- Solo muestra qué músculos trabaja: no se toca; el interruptor lo gira. -->
				<div class="w-44">
					<SegmentedSwitch
						legend="Vista del mapa"
						name="exercise-map-view"
						options={views}
						bind:value={view}
					/>
				</div>
			</div>
			<div class="mx-auto mt-3 h-[30svh] w-full max-w-60">
				<BodyMap bind:view {highlights} {inactive} label="Músculos de {exercise.name}" />
			</div>
			<dl class="mx-auto mt-3 max-w-sm space-y-2 text-sm">
				<div class="flex items-center gap-2.5">
					<span class="size-3.5 shrink-0 rounded-full bg-primary" aria-hidden="true"></span>
					<dt class="text-muted-foreground">Primario</dt>
					<dd class="text-primary">{primary?.name}</dd>
				</div>
				<div class="flex items-center gap-2.5">
					<span
						class="faint size-3.5 shrink-0 rounded-full border border-primary"
						aria-hidden="true"
					></span>
					<dt class="text-muted-foreground">Secundarios</dt>
					<dd class="text-primary">
						{secondaries.length > 0 ? secondaries.join(', ') : 'Ninguno'}
					</dd>
				</div>
			</dl>
		</section>

		<div>
			<h2 class="text-lg text-primary">Sobre el ejercicio</h2>
			<p class="mt-1 text-muted-foreground">{exercise.description}</p>
		</div>

		<div>
			<h2 class="text-lg text-primary">Cómo se hace</h2>
			<ol class="mt-3 space-y-3" aria-label="Pasos de {exercise.name}">
				{#each exercise.steps as step, index (index)}
					<li class="flex gap-3">
						<span
							class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
						>
							{index + 1}
						</span>
						<span class="pt-0.5">{step}</span>
					</li>
				{/each}
			</ol>
		</div>

		<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-2xl border bg-white p-4 text-sm">
			<dt class="text-muted-foreground">Equipo</dt>
			<dd>{equipmentLabel[exercise.equipment]}</dd>
			<dt class="text-muted-foreground">Modo de carga</dt>
			<dd>{loadModeLabel[exercise.loadMode]}</dd>
		</dl>
	</section>
{/if}

{#if following}
	<!-- Espacio para que la barra del siguiente no tape el final de la página. -->
	<div class="h-16" aria-hidden="true"></div>
	<div
		class="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-10 mx-auto max-w-lg px-4 pb-2"
	>
		{#if met}
			<a
				href="/ejercicios/{following.exerciseId}"
				class="flex min-h-14 items-center gap-3 rounded-2xl bg-primary px-4 py-2 shadow-lg active:opacity-90"
			>
				<span class="min-w-0 flex-1">
					<span class="block text-xs text-base-300">Después</span>
					<span class="block truncate text-primary-foreground">
						{exerciseName(following.exerciseId)} · {objectiveLabel(following)}
					</span>
				</span>
				<Icon name="chevron-right" class="size-5 shrink-0 text-primary-foreground" />
			</a>
		{:else}
			<!-- Desactivado hasta cumplir el objetivo: dice qué viene, pero no lleva. -->
			<div
				aria-disabled="true"
				class="flex min-h-14 items-center gap-3 rounded-2xl border border-dashed border-base-content/30 bg-base-200 px-4 py-2"
			>
				<span class="min-w-0 flex-1">
					<span class="block text-xs text-muted-foreground"> Después, al cumplir el objetivo </span>
					<span class="block truncate text-muted-foreground">
						{exerciseName(following.exerciseId)} · {objectiveLabel(following)}
					</span>
				</span>
			</div>
		{/if}
	</div>
{/if}

<SetEditor bind:open={editorOpen} set={editing} onsave={saveSet} ondelete={removeSet} />

<style>
	/* La muestra del secundario: el mismo velo que pinta el mapa. */
	.faint {
		background: color-mix(in oklch, var(--primary) 35%, var(--base-300));
	}
</style>
