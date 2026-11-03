<script lang="ts">
	import type { LoadMode } from '#lib/catalog/index.js';
	import { formatDate } from '#lib/log/labels.js';
	import type { BrokenRecord } from '#lib/log/records.js';
	import type { WorkoutGroup } from '#lib/log/rules.js';
	import SetList from './SetList.svelte';

	/** El historial del ejercicio agrupado por entrenamiento, es decir, por fecha, con sus récords marcados. */
	let {
		groups,
		loadMode,
		brokenRecords
	}: {
		groups: WorkoutGroup[];
		loadMode: LoadMode;
		brokenRecords: ReadonlyMap<string, BrokenRecord[]>;
	} = $props();
</script>

{#if groups.length === 0}
	<p class="text-muted-foreground">Todavía no hay series de este ejercicio.</p>
{:else}
	<div class="space-y-4">
		{#each groups as group (group.workoutId)}
			<section>
				<h3 class="text-sm text-muted-foreground">{formatDate(group.date)}</h3>
				<SetList
					sets={group.sets}
					{loadMode}
					{brokenRecords}
					label="Series del {formatDate(group.date)}"
				/>
			</section>
		{/each}
	</div>
{/if}
