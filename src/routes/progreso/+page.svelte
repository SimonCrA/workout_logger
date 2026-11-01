<script lang="ts">
	import { hasExercises, muscles } from '#lib/catalog/index.js';
	import PointsChart from '#lib/components/PointsChart.svelte';
	import TabPage from '#lib/components/TabPage.svelte';
	import { progressWeeks, weeklyWorkouts, weeklyWorkSets } from '#lib/log/charts.js';
	import { minuteClock } from '#lib/log/clock.svelte.js';
	import { live } from '#lib/log/live.svelte.js';
	import { liveWorkoutHistory } from '#lib/log/workouts.js';

	// El historial vivo desde IndexedDB; las semanas se recalculan con el reloj, así el lunes empieza una nueva.
	const history = live(() => liveWorkoutHistory());
	const clock = minuteClock();
	// Solo el lunes de esta semana: mientras no cambie, los gráficos no se recalculan cada minuto.
	const thisMonday = $derived(progressWeeks(clock.now).at(-1)!.from.getTime());
	const weeks = $derived(progressWeeks(new Date(thisMonday)));
	const entries = $derived(history.value ?? []);
	const workouts = $derived(weeklyWorkouts(entries, weeks));
	const empty = $derived(
		[...workouts, ...weeklyWorkSets(entries, weeks, null)].every((point) => point.value === 0)
	);

	// Todos (vacío) cuenta series de trabajo; un músculo, sus series por músculo.
	const options = muscles.filter((muscle) => hasExercises(muscle.code));
	let muscle = $state('');
	const workSets = $derived(weeklyWorkSets(entries, weeks, muscle || null));
	const muscleName = $derived(options.find((option) => option.code === muscle)?.name);
</script>

<TabPage title="Progreso">
	{#if history.value === undefined}
		<p class="mt-4 text-muted-foreground">Cargando…</p>
	{:else if empty}
		<p class="mt-4 text-muted-foreground">
			Sin series en las últimas doce semanas: aquí verás tus series y entrenamientos por semana.
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
</TabPage>
