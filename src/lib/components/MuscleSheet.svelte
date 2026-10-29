<script lang="ts">
	import { exercisesOf, type Exercise, type Muscle } from '#lib/catalog/index.js';
	import { equipmentLabel } from '#lib/catalog/labels.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import * as Sheet from '#lib/components/ui/sheet/index.js';

	/** Hoja inferior con un músculo y sus ejercicios, primarios antes que secundarios. */
	let { muscle, open = $bindable(false) }: { muscle: Muscle | null; open?: boolean } = $props();

	const lists = $derived(muscle ? exercisesOf(muscle.code) : { primary: [], secondary: [] });
</script>

{#snippet exerciseList(exercises: Exercise[])}
	<ul class="divide-y">
		{#each exercises as exercise (exercise.id)}
			<li>
				<a
					href="/ejercicios/{exercise.id}"
					class="flex items-center justify-between gap-3 py-3 active:bg-muted"
				>
					<span>{exercise.name}</span>
					<Badge variant="outline">{equipmentLabel[exercise.equipment]}</Badge>
				</a>
			</li>
		{/each}
	</ul>
{/snippet}

<Sheet.Root bind:open>
	<Sheet.Content
		side="bottom"
		class="max-h-[80dvh] overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
	>
		{#if muscle}
			<Sheet.Header class="px-0">
				<Sheet.Title class="text-xl">{muscle.name}</Sheet.Title>
				<Sheet.Description>{muscle.description}</Sheet.Description>
			</Sheet.Header>
			{#if lists.primary.length === 0 && lists.secondary.length === 0}
				<p class="text-muted-foreground">Todavía no hay ejercicios para este músculo.</p>
			{/if}
			{@render exerciseList(lists.primary)}
			{#if lists.secondary.length > 0}
				<h3 class="mt-4 text-sm text-muted-foreground">Como músculo secundario</h3>
				{@render exerciseList(lists.secondary)}
			{/if}
		{/if}
	</Sheet.Content>
</Sheet.Root>
