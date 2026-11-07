<script lang="ts">
	import type { LoadMode } from '#lib/catalog/index.js';
	import PeriodPicker from '#lib/components/PeriodPicker.svelte';
	import PointsChart from '#lib/components/PointsChart.svelte';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import {
		exerciseChartViews,
		periodStart,
		pointsInPeriod,
		workoutPoints
	} from '#lib/log/charts.js';
	import { chartViewLabel, formatCount, formatKg, formatTimes } from '#lib/log/labels.js';
	import { isWorkSet } from '#lib/log/rules.js';
	import type { BodyWeightAt } from '#lib/log/profile-rules.js';
	import type { ChartPeriod, ExerciseChartView, WorkoutSet } from '#lib/log/types.js';

	/** El gráfico del ejercicio (spec #20): un punto por entrenamiento, en el periodo elegido (spec #25). */
	let {
		now,
		sets,
		startedAt,
		loadMode,
		bodyWeightAt,
		knowsBodyWeight
	}: {
		/** La hora de la página: los periodos acotados cuentan semanas hasta la actual. */
		now: Date;
		sets: readonly WorkoutSet[];
		/** Cuándo empezó cada entrenamiento, por id. */
		startedAt: Record<string, string>;
		loadMode: LoadMode;
		/** El peso corporal vigente en cada fecha, para el peso efectivo. */
		bodyWeightAt: BodyWeightAt;
		/** Si hay algún registro de peso corporal: sin él, corporal y asistido solo tienen reps. */
		knowsBodyWeight: boolean;
	} = $props();

	const views = $derived(exerciseChartViews(loadMode, knowsBodyWeight));
	let picked = $state<ExerciseChartView | ''>('');
	// La vista elegida si el ejercicio la tiene; si no, la primera.
	const view = $derived(picked && views.includes(picked) ? picked : views[0]);
	// Todo por defecto, como antes del selector; la elección no se guarda.
	let period = $state<ChartPeriod>('all');
	// Solo cambia el lunes de cada semana: mientras tanto, el reloj no recorta los puntos de nuevo.
	const startTime = $derived(periodStart(period, now)?.getTime());
	const allPoints = $derived(workoutPoints(sets, view, { startedAt, loadMode, bodyWeightAt }));
	const points = $derived(
		pointsInPeriod(allPoints, startTime === undefined ? null : new Date(startTime))
	);
	const hasWorkSets = $derived(sets.some(isWorkSet));
	const format = (value: number) =>
		view === 'reps'
			? formatCount(value)
			: view === 'relativeStrength'
				? formatTimes(value)
				: formatKg(value);
	const lines: ExerciseChartView[] = ['maxWeight', 'e1RM', 'relativeStrength'];
</script>

{#if !hasWorkSets}
	<p class="text-muted-foreground">Aquí saldrá un punto por entrenamiento con series de trabajo.</p>
{:else}
	{#if views.length > 1}
		<!-- Las vistas como fichas: la elegida en azul y lima; con peso corporal son cuatro y saltan de fila. -->
		<ToggleGroup.Root
			type="single"
			aria-label="Vista del gráfico"
			value={view}
			onValueChange={(value) => {
				if (value) picked = value as ExerciseChartView;
			}}
			spacing={2}
			class="w-full flex-wrap justify-start"
		>
			{#each views as value (value)}
				<ToggleGroup.Item
					{value}
					aria-label={chartViewLabel[value]}
					class="h-8 rounded-full border-0 bg-muted px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
				>
					{chartViewLabel[value]}
				</ToggleGroup.Item>
			{/each}
		</ToggleGroup.Root>
	{/if}
	{#if allPoints.length > 0 && points.length === 0}
		<p class="mt-3 text-muted-foreground">Ningún entrenamiento en este periodo.</p>
	{:else if points.length === 0}
		<!-- Solo le pasa al 1RM estimado y a la fuerza relativa, que sale de él: las demás vistas tienen punto con cualquier serie de trabajo. -->
		<p class="mt-3 text-muted-foreground">
			{view === 'relativeStrength'
				? 'La fuerza relativa sale del 1RM estimado: series de 10 reps efectivas o menos (reps más RIR).'
				: 'El 1RM estimado sale de series de 10 reps efectivas o menos (reps más RIR).'}
		</p>
	{:else}
		<div class="mt-3">
			<PointsChart
				{points}
				kind={lines.includes(view) ? 'line' : 'bars'}
				label="{chartViewLabel[view]} por entrenamiento"
				series={chartViewLabel[view]}
				{format}
				color="var(--primary)"
			/>
		</div>
	{/if}
	<div class="mt-3">
		<PeriodPicker bind:period />
	</div>
{/if}
