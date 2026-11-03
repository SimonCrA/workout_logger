<script lang="ts">
	import type { LoadMode } from '#lib/catalog/index.js';
	import PointsChart from '#lib/components/PointsChart.svelte';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import { exerciseChartViews, workoutPoints } from '#lib/log/charts.js';
	import { chartViewLabel, formatCount, formatKg } from '#lib/log/labels.js';
	import type { BodyWeightAt } from '#lib/log/profile-rules.js';
	import type { ExerciseChartView, WorkoutSet } from '#lib/log/types.js';

	/** El gráfico del ejercicio (spec #20): un punto por entrenamiento sobre todo el historial. */
	let {
		sets,
		startedAt,
		loadMode,
		bodyWeightAt,
		knowsBodyWeight
	}: {
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
	const points = $derived(workoutPoints(sets, view, { startedAt, loadMode, bodyWeightAt }));
	const format = (value: number) => (view === 'reps' ? formatCount(value) : formatKg(value));
</script>

{#if points.length === 0}
	<p class="text-muted-foreground">Aquí saldrá un punto por entrenamiento con series de trabajo.</p>
{:else}
	{#if views.length > 1}
		<ToggleGroup.Root
			type="single"
			variant="outline"
			aria-label="Vista del gráfico"
			value={view}
			onValueChange={(value) => {
				if (value) picked = value as ExerciseChartView;
			}}
			class="justify-start"
		>
			{#each views as value (value)}
				<ToggleGroup.Item {value} aria-label={chartViewLabel[value]}>
					{chartViewLabel[value]}
				</ToggleGroup.Item>
			{/each}
		</ToggleGroup.Root>
	{/if}
	<div class="mt-3">
		<PointsChart
			{points}
			kind={view === 'maxWeight' ? 'line' : 'bars'}
			label="{chartViewLabel[view]} por entrenamiento"
			series={chartViewLabel[view]}
			{format}
		/>
	</div>
{/if}
