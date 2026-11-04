<script lang="ts">
	import type { DaySets, WeekSummary, WeekTotals } from '#lib/log/dashboard.js';
	import { bandLabel, dayInitial, daySetsLabel, weekDeltaLabel } from '#lib/log/labels.js';
	import type { Trend } from '#lib/log/types.js';

	/**
	 * "Últimos 7 días": la semana dibujada (una barra con las series de trabajo de cada día, hoy el
	 * último) y debajo los tres números, cada uno frente a los 7 días anteriores, y los músculos en banda.
	 */
	let { week, days }: { week: WeekSummary; days: DaySets[] } = $props();

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
	// La barra más alta es el día con más series; un día sin series queda como una marca baja.
	const maxDaySets = $derived(Math.max(1, ...days.map((day) => day.sets)));
	const BAR_MAX = 48;
	const barHeight = (sets: number) => (sets === 0 ? 4 : Math.max(8, (sets / maxDaySets) * BAR_MAX));
</script>

<section aria-labelledby="week-title">
	<h2 id="week-title" class="text-lg">Últimos 7 días</h2>
	<div class="mt-2 rounded-xl border bg-white">
		<ol aria-label="Series por día" class="grid grid-cols-7 gap-1 px-3 pt-3 pb-2">
			{#each days as { day, sets }, index (day.getTime())}
				{@const today = index === days.length - 1}
				<li class="flex flex-col items-center gap-1.5" aria-label={daySetsLabel(day, sets)}>
					<span
						class="text-[11px] leading-none text-muted-foreground tabular-nums"
						aria-hidden="true"
					>
						{sets > 0 ? sets : ''}&nbsp;
					</span>
					<span class="flex h-12 items-end" aria-hidden="true">
						<span
							class={['w-3 rounded-full', sets > 0 ? 'bg-primary' : 'bg-base-300']}
							style="height: {barHeight(sets)}px"
						></span>
					</span>
					<span
						class={[
							'grid size-6 place-items-center rounded-full text-xs',
							today ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
						]}
						aria-hidden="true"
					>
						{dayInitial(day)}
					</span>
				</li>
			{/each}
		</ol>
		<dl aria-label="Últimos 7 días" class="grid grid-cols-3 divide-x border-t">
			{#each tiles as { key, title } (key)}
				<!-- El número va primero a la vista, aunque el título lo preceda en el marcado: así los tres quedan a la misma altura. -->
				<div class="flex min-w-0 flex-col px-3 py-2.5">
					<dt class="text-xs text-muted-foreground">{title}</dt>
					<dd class="order-first text-2xl leading-tight text-primary">{week.current[key]}</dd>
					<dd class="mt-auto pt-1 text-xs {trendClass[week.trends[key]]}">
						{weekDeltaLabel(week.current[key], week.previous[key])}
					</dd>
				</div>
			{/each}
		</dl>
	</div>
	<p class="mt-2 text-sm text-muted-foreground">{bandLabel(week.band)}</p>
</section>
