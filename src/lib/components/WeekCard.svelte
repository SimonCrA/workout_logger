<script lang="ts">
	import type { WeekSummary, WeekTotals } from '#lib/log/dashboard.js';
	import { bandLabel, weekDeltaLabel } from '#lib/log/labels.js';
	import type { Trend } from '#lib/log/types.js';

	/** "Últimos 7 días": tres números en una franja, cada uno frente a los 7 días anteriores, y los músculos en banda. */
	let { week }: { week: WeekSummary } = $props();

	const tiles: { key: keyof WeekTotals; title: string }[] = [
		{ key: 'workouts', title: 'Entrenamientos' },
		{ key: 'sets', title: 'Series de trabajo' },
		{ key: 'reps', title: 'Reps' }
	];
	const trendClass: Record<Trend, string> = {
		up: 'text-success-content',
		down: 'text-warning-content',
		same: 'text-muted-foreground'
	};
</script>

<section aria-labelledby="week-title">
	<h2 id="week-title" class="text-lg">Últimos 7 días</h2>
	<dl aria-label="Últimos 7 días" class="mt-2 grid grid-cols-3 divide-x rounded-xl border bg-white">
		{#each tiles as { key, title } (key)}
			<div class="min-w-0 px-3 py-2.5">
				<dt class="text-xs text-muted-foreground">{title}</dt>
				<dd class="mt-0.5 text-2xl">{week.current[key]}</dd>
				<dd class="text-xs {trendClass[week.trends[key]]}">
					{weekDeltaLabel(week.current[key], week.previous[key])}
				</dd>
			</div>
		{/each}
	</dl>
	<p class="mt-2 text-sm text-muted-foreground">{bandLabel(week.band)}</p>
</section>
