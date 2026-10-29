<script lang="ts">
	import type { LoadMode } from '#lib/catalog/index.js';
	import { formatWeight, setTypeLabel } from '#lib/log/labels.js';
	import type { WorkoutSet } from '#lib/log/types.js';

	/** Las series de un entrenamiento, numeradas: peso × reps y, si los hay, tipo, RIR y nota. */
	let { sets, loadMode, label }: { sets: WorkoutSet[]; loadMode: LoadMode; label: string } =
		$props();
</script>

<ol aria-label={label} class="divide-y">
	{#each sets as set, index (set.id)}
		<li class="flex items-baseline gap-3 py-2">
			<span class="w-5 text-sm text-muted-foreground">{index + 1}</span>
			<span class="text-lg">{formatWeight(set.weight, loadMode)} × {set.reps}</span>
			<span class="text-sm text-muted-foreground">
				{#if set.type !== 'normal'}{setTypeLabel[set.type]}{/if}
				{#if set.rir !== null}RIR {set.rir}{/if}
				{#if set.note}· {set.note}{/if}
			</span>
		</li>
	{/each}
</ol>
