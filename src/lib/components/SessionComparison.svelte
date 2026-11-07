<script lang="ts">
	import type { LoadMode } from '#lib/catalog/index.js';
	import type { SessionSummary } from '#lib/log/indicators.js';
	import { differenceLabel, formatKg, formatWeight, relativeDayLabel } from '#lib/log/labels.js';

	/**
	 * "Esta vez frente a la anterior": las series de la última sesión del ejercicio junto a las de la
	 * de antes, y debajo el volumen, las reps y el 1RM estimado de la última con su diferencia (verde
	 * si sube, ámbar si baja). Sin sesión anterior, solo la última.
	 */
	let {
		latest,
		previous,
		loadMode,
		now
	}: {
		latest: SessionSummary;
		previous: SessionSummary | null;
		loadMode: LoadMode;
		now: Date;
	} = $props();

	type Metric = { title: string; value: string; delta: number | null; unit: 'kg' | 'count' };
	const kgOrDash = (kg: number | null) => (kg === null ? '—' : formatKg(kg));
	const diff = (a: number | null, b: number | null | undefined) =>
		a === null || b === null || b === undefined ? null : a - b;

	const metrics = $derived<Metric[]>([
		{
			title: 'Volumen',
			value: kgOrDash(latest.volume),
			delta: diff(latest.volume, previous?.volume),
			unit: 'kg'
		},
		{
			title: 'Reps',
			value: String(latest.reps),
			delta: previous ? latest.reps - previous.reps : null,
			unit: 'count'
		},
		{
			title: '1RM estimado',
			value: kgOrDash(latest.e1RM),
			delta: diff(latest.e1RM, previous?.e1RM),
			unit: 'kg'
		}
	]);
</script>

<section aria-labelledby="comparison-title" class="overflow-hidden rounded-2xl border bg-white">
	<h2 id="comparison-title" class="px-4 pt-3.5 pb-2.5 text-lg text-primary">
		{previous ? 'Esta vez frente a la anterior' : 'Tu último entrenamiento'}
	</h2>
	<div class={['grid border-t', previous ? 'grid-cols-2' : 'grid-cols-1']}>
		<div class="latest space-y-2 px-4 py-3">
			<p class="text-xs">{relativeDayLabel(latest.date, now)}</p>
			<ol aria-label="Series del último entrenamiento" class="space-y-1.5">
				{#each latest.sets as set (set.id)}
					<li class="text-base text-primary">
						{formatWeight(set.weight, loadMode)} × {set.reps}
					</li>
				{/each}
			</ol>
		</div>
		{#if previous}
			<div class="space-y-2 border-l px-4 py-3 text-muted-foreground">
				<p class="text-xs">{relativeDayLabel(previous.date, now)}</p>
				<ol aria-label="Series del entrenamiento anterior" class="space-y-1.5">
					{#each previous.sets as set (set.id)}
						<li class="text-base">{formatWeight(set.weight, loadMode)} × {set.reps}</li>
					{/each}
				</ol>
			</div>
		{/if}
	</div>
	<dl class="grid grid-cols-3 border-t">
		{#each metrics as metric, index (metric.title)}
			<div class={['px-3 py-2.5', index > 0 && 'border-l']}>
				<dt class="text-xs text-muted-foreground">{metric.title}</dt>
				<dd class="mt-1 text-lg text-primary">{metric.value}</dd>
				{#if metric.delta !== null}
					<dd
						class={[
							'text-xs',
							metric.delta > 0
								? 'text-success-content'
								: metric.delta < 0
									? 'text-warning-content'
									: 'text-muted-foreground'
						]}
					>
						{differenceLabel(metric.delta, metric.unit)}
					</dd>
				{/if}
			</div>
		{/each}
	</dl>
</section>

<style>
	/* La última sesión, con un velo del lima de la app. */
	.latest {
		background: color-mix(in oklch, var(--primary-foreground) 16%, white);
	}
</style>
