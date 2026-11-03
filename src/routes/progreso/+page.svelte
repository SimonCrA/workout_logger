<script lang="ts">
	import { hasExercises, muscles } from '#lib/catalog/index.js';
	import PeriodPicker from '#lib/components/PeriodPicker.svelte';
	import PointsChart from '#lib/components/PointsChart.svelte';
	import TabPage from '#lib/components/TabPage.svelte';
	import {
		bodyWeightPoints,
		bodyWeightRange,
		firstWorkoutStart,
		periodStart,
		pointsInPeriod,
		progressWeeks,
		weeklyWorkouts,
		weeklyWorkSets
	} from '#lib/log/charts.js';
	import { minuteClock } from '#lib/log/clock.svelte.js';
	import { formatKg } from '#lib/log/labels.js';
	import { live } from '#lib/log/live.svelte.js';
	import { liveBodyWeights } from '#lib/log/profile.js';
	import type { ChartPeriod } from '#lib/log/types.js';
	import { liveWorkoutHistory } from '#lib/log/workouts.js';

	// El historial vivo desde IndexedDB; las semanas se recalculan con el reloj, así el lunes empieza una nueva.
	const history = live(() => liveWorkoutHistory());
	const bodyWeights = live(() => liveBodyWeights());
	const clock = minuteClock();
	// Solo el lunes de esta semana: mientras no cambie, los gráficos no se recalculan cada minuto.
	const thisMonday = $derived(progressWeeks(clock.now).at(-1)!.from.getTime());
	// 12 semanas por defecto, como antes del selector; la elección no se guarda (spec #25).
	let period = $state<ChartPeriod>('12w');
	const entries = $derived(history.value ?? []);
	// Todo empieza en la semana del primer entrenamiento.
	const firstTime = $derived(firstWorkoutStart(entries)?.getTime());
	const weeks = $derived(
		progressWeeks(
			new Date(thisMonday),
			period,
			firstTime === undefined ? undefined : new Date(firstTime)
		)
	);
	const workouts = $derived(weeklyWorkouts(entries, weeks));
	const empty = $derived(
		[...workouts, ...weeklyWorkSets(entries, weeks, null)].every((point) => point.value === 0)
	);

	// Todos (vacío) cuenta series de trabajo; un músculo, sus series por músculo.
	const options = muscles.filter((muscle) => hasExercises(muscle.code));
	let muscle = $state('');
	const workSets = $derived(weeklyWorkSets(entries, weeks, muscle || null));
	const muscleName = $derived(options.find((option) => option.code === muscle)?.name);

	// Peso corporal (spec #31): un punto por registro, con su propio estado vacío aunque haya series.
	// El peso corporal se recorta por fecha, desde el lunes en que empieza el periodo.
	const allWeightPoints = $derived(bodyWeightPoints(bodyWeights.value ?? []));
	const weightPoints = $derived(
		pointsInPeriod(allWeightPoints, periodStart(period, new Date(thisMonday)))
	);

	const emptyPeriod: Record<ChartPeriod, string> = {
		'12w': 'las últimas doce semanas',
		'6m': 'los últimos seis meses',
		'1y': 'el último año',
		all: 'todo el historial'
	};
</script>

<TabPage title="Progreso">
	{#if history.value === undefined || bodyWeights.value === undefined}
		<p class="mt-4 text-muted-foreground">Cargando…</p>
	{:else}
		<div class="mt-4">
			<PeriodPicker bind:period />
		</div>
		{#if empty}
			<p class="mt-4 text-muted-foreground">
				Sin series en {emptyPeriod[period]}: aquí verás tus series y entrenamientos por semana.
			</p>
		{:else}
			<section class="mt-6">
				<h2 class="text-lg">Series de trabajo por semana</h2>
				<label class="mt-3 flex items-center gap-2 text-sm">
					<span class="text-muted-foreground">Músculo</span>
					<select
						bind:value={muscle}
						class="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2"
					>
						<option value="">Todos</option>
						{#each options as option (option.code)}
							<option value={option.code}>{option.name}</option>
						{/each}
					</select>
				</label>
				<div class="mt-3">
					<PointsChart
						points={workSets}
						kind="bars"
						label={muscleName
							? `Series por músculo por semana: ${muscleName}`
							: 'Series de trabajo por semana'}
						series={muscleName ? `Series de ${muscleName}` : 'Series de trabajo'}
					/>
				</div>
			</section>

			<section class="mt-8">
				<h2 class="text-lg">Entrenamientos por semana</h2>
				<div class="mt-3">
					<PointsChart
						points={workouts}
						kind="bars"
						label="Entrenamientos por semana"
						series="Entrenamientos"
					/>
				</div>
			</section>
		{/if}

		<section class="mt-8">
			<h2 class="text-lg">Peso corporal</h2>
			{#if allWeightPoints.length > 0 && weightPoints.length === 0}
				<p class="mt-3 text-muted-foreground">Ningún peso registrado en este periodo.</p>
			{:else if weightPoints.length === 0}
				<p class="mt-3 text-muted-foreground">
					Aquí saldrá un punto por cada peso que registres.
					<a href="/perfil" class="text-primary underline">Registra tu peso en Perfil</a>.
				</p>
			{:else}
				<div class="mt-3">
					<PointsChart
						points={weightPoints}
						kind="line"
						label="Peso corporal"
						series="Peso corporal"
						format={formatKg}
						domain={bodyWeightRange(weightPoints)}
					/>
				</div>
			{/if}
		</section>
	{/if}
</TabPage>
