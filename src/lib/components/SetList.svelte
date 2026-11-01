<script lang="ts">
	import type { LoadMode } from '#lib/catalog/index.js';
	import { formatWeight, setTypeLabel } from '#lib/log/labels.js';
	import type { WorkoutSet } from '#lib/log/types.js';

	/**
	 * Las series de un entrenamiento, numeradas: peso × reps y, si los hay, tipo, RIR y nota. Con
	 * `onedit`, cada fila es un botón que abre la corrección de su serie (spec #18).
	 */
	let {
		sets,
		loadMode,
		label,
		onedit
	}: {
		sets: WorkoutSet[];
		loadMode: LoadMode;
		label: string;
		onedit?: (set: WorkoutSet) => void;
	} = $props();
</script>

{#snippet row(set: WorkoutSet, index: number)}
	<span class="w-5 text-sm text-muted-foreground">{index + 1}</span>
	<span class="text-lg">{formatWeight(set.weight, loadMode)} × {set.reps}</span>
	<span class="text-sm text-muted-foreground">
		{#if set.type !== 'normal'}{setTypeLabel[set.type]}{/if}
		{#if set.rir !== null}RIR {set.rir}{/if}
		{#if set.note}· {set.note}{/if}
	</span>
{/snippet}

<ol aria-label={label} class="divide-y">
	{#each sets as set, index (set.id)}
		<li>
			{#if onedit}
				<button
					type="button"
					class="flex w-full items-baseline gap-3 py-2 text-left active:bg-muted"
					onclick={() => onedit(set)}
				>
					{@render row(set, index)}
				</button>
			{:else}
				<div class="flex items-baseline gap-3 py-2">
					{@render row(set, index)}
				</div>
			{/if}
		</li>
	{/each}
</ol>
