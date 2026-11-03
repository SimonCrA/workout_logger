<script lang="ts">
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import { chartPeriodLabel } from '#lib/log/labels.js';
	import type { ChartPeriod } from '#lib/log/types.js';

	/** El periodo de los gráficos de una página (spec #25): uno por página, que no se guarda. */
	let { period = $bindable() }: { period: ChartPeriod } = $props();

	const periods = Object.keys(chartPeriodLabel) as ChartPeriod[];
</script>

<ToggleGroup.Root
	type="single"
	variant="outline"
	size="sm"
	aria-label="Periodo"
	value={period}
	onValueChange={(value) => {
		if (value) period = value as ChartPeriod;
	}}
	spacing={2}
	class="w-full flex-wrap justify-start"
>
	{#each periods as value (value)}
		<ToggleGroup.Item {value} aria-label={chartPeriodLabel[value]}>
			{chartPeriodLabel[value]}
		</ToggleGroup.Item>
	{/each}
</ToggleGroup.Root>
