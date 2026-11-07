<script lang="ts">
	import { BarChart, LineChart, type AnyScale } from 'layerchart';
	import * as Chart from '#lib/components/ui/chart/index.js';
	import { axisTicks, dateFormats, valueAxisTicks, type ChartPoint } from '#lib/log/charts.js';
	import { formatCount } from '#lib/log/labels.js';

	/**
	 * Un gráfico de puntos por fecha (spec #20): línea o barras, con el nombre accesible que se le
	 * da. El eje de fechas rotula unas pocas a intervalos iguales y suelta las que se pisarían, así
	 * un año de semanas cabe en un teléfono (spec #25).
	 */
	let {
		points,
		kind,
		label,
		series,
		format = formatCount,
		domain,
		color = 'var(--chart-2)'
	}: {
		points: ChartPoint[];
		kind: 'line' | 'bars';
		/** El nombre accesible del gráfico. */
		label: string;
		/** Lo que mide cada punto, en el tooltip. */
		series: string;
		format?: (value: number) => string;
		/** El tramo del eje de valores; sin él, desde cero hasta el punto más alto. */
		domain?: [number, number];
		/** El color de la serie; el naranja de los gráficos si no se dice. */
		color?: string;
	} = $props();

	// Unas cinco marcas en el eje de valores, y el tope redondeado a la siguiente: el punto más alto nunca queda por encima.
	const TICKS = 5;
	const config = $derived({ value: { label: series, color } });
	const seriesList = $derived([{ key: 'value', ...config.value }]);
	const dates = $derived(points.map((point) => point.date));
	const formats = $derived(dateFormats(dates));
	const axes = $derived({
		xAxis: { format: formats.axis, ticks: axisTicks(dates, formats.axis), tickOcclusion: true },
		yAxis: { format, ticks: wholeTicks }
	});

	// Las etiquetas del eje de valores se dibujan a la izquierda de la caja del gráfico: se reserva
	// el ancho de la más larga de las que se van a pintar, para que no salgan del contenedor ni sobre hueco.
	const CHAR_PX = 7.5;
	const padding = $derived.by(() => {
		const ticks = valueAxisTicks(
			points.map((point) => point.value),
			domain,
			TICKS
		);
		const whole = ticks.filter(Number.isInteger);
		const shown = whole.length > 1 ? whole : ticks;
		const longest = Math.max(...shown.map((tick) => format(tick).length));
		return { top: 4, right: 4, bottom: 20, left: Math.ceil(longest * CHAR_PX) + 8 };
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
	<Chart.Tooltip labelFormatter={formats.tooltip} formatter={row} />
{/snippet}

<div role="img" aria-label={label}>
	<Chart.Container {config} class="aspect-auto h-56 w-full">
		{#if kind === 'line'}
			<LineChart
				data={points}
				x="date"
				y="value"
				yNice={TICKS}
				yDomain={domain}
				series={seriesList}
				{padding}
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
				{padding}
				props={{ ...axes, bars: { stroke: 'none', rounded: 'top', radius: 4 } }}
				{tooltip}
			/>
		{/if}
	</Chart.Container>
</div>
