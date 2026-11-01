<script lang="ts">
	import Icon from '#lib/components/Icon.svelte';
	import type { WeekSummary, WeekTotals } from '#lib/log/dashboard.js';
	import { bandLabel, trendLabel } from '#lib/log/labels.js';
	import type { Trend } from '#lib/log/types.js';

	/** La tarjeta "Últimos 7 días": tres números, cada uno con su flecha frente a los 7 días anteriores, y los músculos en banda. */
	let { week }: { week: WeekSummary } = $props();

	// Los íconos van declarados en datos para que el test del sprite los vea.
	const trendIcon: Record<Trend, { icon: string }> = {
		up: { icon: 'arrow-up' },
		down: { icon: 'arrow-down' },
		same: { icon: 'minus' }
	};
	const tiles: { key: keyof WeekTotals; title: string }[] = [
		{ key: 'workouts', title: 'Entrenamientos' },
		{ key: 'sets', title: 'Series de trabajo' },
		{ key: 'reps', title: 'Reps' }
	];
</script>

<section class="rounded-lg border p-4">
	<h2 class="text-lg">Últimos 7 días</h2>
	<dl aria-label="Últimos 7 días" class="mt-3 grid grid-cols-3 gap-2">
		{#each tiles as { key, title } (key)}
			{@const trend = week.trends[key]}
			<div class="rounded-lg bg-muted p-2">
				<dt class="text-xs text-muted-foreground">{title}</dt>
				<dd class="mt-1 flex items-center gap-1 text-xl">
					{week.current[key]}
					<span role="img" aria-label={trendLabel[trend]}>
						<Icon name={trendIcon[trend].icon} class="size-4 text-muted-foreground" />
					</span>
				</dd>
				<dd class="text-xs text-muted-foreground">antes: {week.previous[key]}</dd>
			</div>
		{/each}
	</dl>
	<p class="mt-3 text-sm text-muted-foreground">{bandLabel(week.band)}</p>
</section>
