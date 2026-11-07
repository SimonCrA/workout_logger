<script lang="ts">
	import type { LoadMode, RoutineExercise } from '#lib/catalog/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { formatWeight, setCountLabel, setTypeLabel } from '#lib/log/labels.js';
	import type { BrokenRecord } from '#lib/log/records.js';
	import { isWorkSet } from '#lib/log/rules.js';
	import type { WorkoutSet } from '#lib/log/types.js';

	/**
	 * Lo hecho hoy en el ejercicio, bajo el registro: cada serie numerada (peso × reps, tipo, RIR,
	 * nota y la marca "Récord"), que se toca para corregirla (spec #18), y "Borrar última". Con
	 * rutina, las series de trabajo que faltan se ven "por hacer", así se lee cuánto queda.
	 */
	let {
		sets,
		prescribed,
		loadMode,
		heldRecords,
		onedit,
		ondeletelast
	}: {
		sets: WorkoutSet[];
		prescribed: RoutineExercise | null;
		loadMode: LoadMode;
		heldRecords: ReadonlyMap<string, BrokenRecord[]>;
		onedit: (set: WorkoutSet) => void;
		ondeletelast: () => void;
	} = $props();

	const workDone = $derived(sets.filter(isWorkSet).length);
	const pending = $derived(prescribed ? Math.max(0, prescribed.sets - workDone) : 0);
	const count = $derived(
		prescribed
			? `${Math.min(workDone, prescribed.sets)} de ${prescribed.sets}`
			: setCountLabel(sets.length)
	);

	function details(set: WorkoutSet): string {
		return [
			set.type === 'normal' ? null : setTypeLabel[set.type],
			set.rir === null ? null : `RIR ${set.rir}`,
			set.note
		]
			.filter((part) => part)
			.join(' · ');
	}
</script>

<section aria-labelledby="today-title" class="rounded-3xl border bg-white">
	<div class="flex items-center justify-between gap-3 px-4 pt-3.5 pb-2">
		<h2 id="today-title" class="text-lg text-primary">
			Hecho hoy <span class="ml-1 text-sm text-muted-foreground">{count}</span>
		</h2>
		{#if sets.length > 0}
			<Button variant="ghost" size="sm" class="-mr-2 text-error-content" onclick={ondeletelast}>
				Borrar última
			</Button>
		{/if}
	</div>

	{#if sets.length === 0 && pending === 0}
		<p class="px-4 pb-4 text-sm text-muted-foreground">Todavía no registras series hoy.</p>
	{/if}

	{#if sets.length > 0}
		<ol aria-label="Series de hoy" class="divide-y border-t">
			{#each sets as set, index (set.id)}
				{@const extra = details(set)}
				<li>
					<button
						type="button"
						class="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-muted"
						onclick={() => onedit(set)}
					>
						<span
							class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
						>
							{index + 1}
						</span>
						<span class="min-w-0 flex-1">
							<span class="block text-lg text-primary">
								{formatWeight(set.weight, loadMode)} × {set.reps}
							</span>
							{#if extra}
								<span class="block truncate text-xs text-muted-foreground">{extra}</span>
							{/if}
						</span>
						{#if heldRecords.has(set.id)}
							<Badge class="shrink-0">Récord</Badge>
						{/if}
					</button>
				</li>
			{/each}
		</ol>
	{/if}

	{#if pending > 0}
		<ul aria-label="Series por hacer" class="divide-y border-t">
			{#each { length: pending }, index (index)}
				<li class="flex items-center gap-3 px-4 py-3 text-muted-foreground">
					<span
						class="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-base-content/30 text-xs"
					>
						{sets.length + index + 1}
					</span>
					<span class="text-sm">Por hacer</span>
				</li>
			{/each}
		</ul>
	{/if}
</section>
