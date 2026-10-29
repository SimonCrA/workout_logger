<script lang="ts">
	import type { LoadMode } from '#lib/catalog/index.js';
	import { formatDate } from '#lib/log/labels.js';
	import type { WorkoutSet } from '#lib/log/types.js';
	import SetList from './SetList.svelte';

	/** El historial del ejercicio agrupado por entrenamiento, es decir, por fecha. */
	let {
		groups,
		loadMode
	}: { groups: { workoutId: string; date: string; sets: WorkoutSet[] }[]; loadMode: LoadMode } =
		$props();
</script>

{#if groups.length === 0}
	<p class="text-muted-foreground">Todavía no hay series de este ejercicio.</p>
{:else}
	<div class="space-y-4">
		{#each groups as group (group.workoutId)}
			<section>
				<h3 class="text-sm text-muted-foreground">{formatDate(group.date)}</h3>
				<SetList sets={group.sets} {loadMode} label="Series del {formatDate(group.date)}" />
			</section>
		{/each}
	</div>
{/if}
