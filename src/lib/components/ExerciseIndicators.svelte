<script lang="ts">
	import Icon from '#lib/components/Icon.svelte';
	import type { ExerciseIndicators, Milestone } from '#lib/log/indicators.js';
	import { formatDate, formatKg, formatRelativeStrength } from '#lib/log/labels.js';

	/**
	 * Los indicadores del ejercicio en fichas (los seis heredados, el 1RM estimado y la fuerza
	 * relativa); sin series de trabajo, un estado vacío.
	 */
	let {
		indicators,
		knowsBodyWeight
	}: {
		indicators: ExerciseIndicators;
		/** Sin ningún peso corporal no hay fuerza relativa: en su lugar, una nota que lleva a Perfil. */
		knowsBodyWeight: boolean;
	} = $props();

	const kg = (value: number | null) => (value === null ? '—' : formatKg(value));
	const when = (milestone: Pick<Milestone, 'at'> | null, preposition: string) =>
		milestone ? `${preposition} ${formatDate(milestone.at)}` : '';
	const tiles = $derived([
		{ title: 'Series', value: String(indicators.sets), when: '', icon: 'champion' },
		{ title: 'Reps', value: String(indicators.reps), when: '', icon: 'champion' },
		{
			title: 'Volumen total',
			value: kg(indicators.volume?.kg ?? null),
			when: when(indicators.volume, 'al'),
			icon: 'scale'
		},
		{
			title: 'Peso máximo',
			value: kg(indicators.maxWeight?.kg ?? null),
			when: when(indicators.maxWeight, 'el'),
			icon: 'champion'
		},
		{
			title: '1RM estimado',
			value: kg(indicators.e1RM?.kg ?? null),
			when: when(indicators.e1RM, 'el'),
			icon: 'champion'
		},
		...(knowsBodyWeight
			? [
					{
						title: 'Fuerza relativa',
						value: indicators.relativeStrength
							? formatRelativeStrength(indicators.relativeStrength.times)
							: '—',
						when: when(indicators.relativeStrength, 'el'),
						icon: 'champion'
					}
				]
			: []),
		{ title: 'Peso total', value: kg(indicators.totalWeight), when: '', icon: 'scale' },
		{ title: 'Promedio por rep', value: kg(indicators.averagePerRep), when: '', icon: 'dumbbell' }
	]);
</script>

{#if indicators.sets === 0}
	<p class="text-muted-foreground">
		Sin series de trabajo todavía: las de calentamiento no cuentan.
	</p>
{:else}
	<dl aria-label="Indicadores" class="grid grid-cols-2 gap-3">
		{#each tiles as tile (tile.title)}
			<div class="relative rounded-lg bg-muted p-3">
				<Icon name={tile.icon} class="absolute top-3 right-3 size-5 text-muted-foreground" />
				<dt class="text-xs text-muted-foreground">{tile.title}</dt>
				<dd class="mt-1 text-xl">{tile.value}</dd>
				{#if tile.when}
					<dd class="text-xs text-muted-foreground">{tile.when}</dd>
				{/if}
			</div>
		{/each}
	</dl>
	{#if indicators.volume === null}
		<p class="mt-3 text-sm text-muted-foreground">
			Los kilos necesitan tu peso corporal, que se registra en
			<a href="/perfil" class="text-primary underline">Perfil</a>.
		</p>
	{:else if !knowsBodyWeight}
		<p class="mt-3 text-sm text-muted-foreground">
			La fuerza relativa necesita tu peso corporal, que se registra en
			<a href="/perfil" class="text-primary underline">Perfil</a>.
		</p>
	{/if}
{/if}
