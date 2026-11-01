<script lang="ts">
	import { BarChart, LineChart, type AnyScale } from 'layerchart';
	import * as Chart from '#lib/components/ui/chart/index.js';
	import type { ChartPoint } from '#lib/log/charts.js';
	import { formatCount, formatDayMonth } from '#lib/log/labels.js';

	/**
	 * Un gráfico de puntos por fecha (spec #20): línea o barras, con el nombre accesible que se le
	 * da. El eje de fechas suelta las etiquetas que se pisarían, así cabe en un teléfono.
	 */
	let {
		points,
		kind,
		label,
		series,
		format = formatCount
	}: {
		points: ChartPoint[];
		kind: 'line' | 'bars';
		/** El nombre accesible del gráfico. */
		label: string;
		/** Lo que mide cada punto, en el tooltip. */
		series: string;
		format?: (value: number) => string;
	} = $props();

	// Unas cinco marcas en el eje de valores, y el tope redondeado a la siguiente: el punto más alto nunca queda por encima.
	const TICKS = 5;
	const config = $derived({ value: { label: series, color: 'var(--chart-2)' } });
	const seriesList = $derived([{ key: 'value', ...config.value }]);
	const axes = $derived({
		xAxis: { format: formatDayMonth, tickOcclusion: true },
		yAxis: { format, ticks: wholeTicks }
	});

	// Se cuentan series, reps y entrenamientos: nada de marcas a 0,2, salvo que no quede otra (un tope de 0,5 series por músculo).
	function wholeTicks(scale: AnyScale) {
		const ticks: number[] = scale.ticks?.(TICKS) ?? [];
		const whole = ticks.filter(Number.isInteger);
		return whole.length > 1 ? whole : ticks;
	}
</script>

{#snippet row({ value, name }: { value: unknown; name: string })}
	<div class="flex w-full justify-between gap-3 leading-none">
		<span class="text-muted-foreground">{name}</span>
		<span class="font-medium text-foreground tabular-nums">{format(Number(value))}</span>
	</div>
{/snippet}

{#snippet tooltip()}
	<Chart.Tooltip labelFormatter={formatDayMonth} formatter={row} />
{/snippet}

<div role="img" aria-label={label}>
	<Chart.Container {config} class="aspect-auto h-56 w-full">
		{#if kind === 'line'}
			<LineChart
				data={points}
				x="date"
				y="value"
				yNice={TICKS}
				series={seriesList}
				points={{ r: 3 }}
				props={{ ...axes, spline: { strokeWidth: 2 } }}
				{tooltip}
			/>
		{:else}
			<BarChart
				data={points}
				x="date"
				y="value"
				yNice={TICKS}
				series={seriesList}
				bandPadding={0.25}
				props={{ ...axes, bars: { stroke: 'none', rounded: 'top', radius: 4 } }}
				{tooltip}
			/>
		{/if}
	</Chart.Container>
</div>
