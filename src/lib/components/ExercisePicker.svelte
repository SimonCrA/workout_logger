<script lang="ts">
	import {
		equipmentLabel,
		exercises,
		exercisesOf,
		searchCatalog,
		type Exercise,
		type Muscle
	} from '#lib/catalog/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import * as Sheet from '#lib/components/ui/sheet/index.js';

	/**
	 * Hoja inferior con el buscador del catálogo para añadir un ejercicio a una rutina. Los que ya
	 * están en ella se ven marcados y no se eligen: un ejercicio no se repite (spec #14).
	 */
	let {
		open = $bindable(false),
		included,
		onpick
	}: {
		open?: boolean;
		included: readonly string[];
		onpick: (exercise: Exercise) => void;
	} = $props();

	let query = $state('');
	let muscle = $state<Muscle | null>(null);

	const results = $derived(searchCatalog(query));
	// Sin escribir nada se ve el catálogo entero; con un músculo elegido, sus ejercicios, primarios antes.
	const shown = $derived.by((): Exercise[] => {
		if (muscle) {
			const { primary, secondary } = exercisesOf(muscle.code);
			return [...primary, ...secondary];
		}
		return query.trim() === '' ? [...exercises] : results.exercises;
	});

	function pick(exercise: Exercise) {
		onpick(exercise);
		open = false;
	}

	$effect(() => {
		// Cada apertura empieza con el buscador limpio.
		if (!open) {
			query = '';
			muscle = null;
		}
	});
</script>

<Sheet.Root bind:open>
	<Sheet.Content
		side="bottom"
		class="max-h-[85dvh] overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
	>
		<Sheet.Header class="px-0">
			<Sheet.Title class="text-xl">Añadir ejercicio</Sheet.Title>
			<Sheet.Description>Busca por músculo o por nombre.</Sheet.Description>
		</Sheet.Header>
		<Input
			type="search"
			placeholder="Músculo o ejercicio"
			aria-label="Buscar músculo o ejercicio"
			autocomplete="off"
			bind:value={query}
			oninput={() => (muscle = null)}
		/>
		{#if muscle}
			<p class="mt-3 text-sm text-muted-foreground">
				Ejercicios de {muscle.name} ·
				<button type="button" class="underline" onclick={() => (muscle = null)}>ver todos</button>
			</p>
		{:else if results.muscles.length > 0}
			<ul class="mt-3 flex flex-wrap gap-2" aria-label="Músculos">
				{#each results.muscles as match (match.code)}
					<li>
						<Button type="button" variant="outline" size="sm" onclick={() => (muscle = match)}>
							{match.name}
						</Button>
					</li>
				{/each}
			</ul>
		{/if}
		{#if shown.length === 0}
			<p class="mt-3 text-muted-foreground">Nada con ese nombre.</p>
		{:else}
			<ul class="mt-3 divide-y" aria-label="Ejercicios para añadir">
				{#each shown as exercise (exercise.id)}
					{@const already = included.includes(exercise.id)}
					<li>
						<button
							type="button"
							class="flex w-full items-center justify-between gap-3 py-3 text-left active:bg-muted disabled:opacity-50"
							disabled={already}
							onclick={() => pick(exercise)}
						>
							<span>{exercise.name}</span>
							<Badge variant="outline">
								{already ? 'En la rutina' : equipmentLabel[exercise.equipment]}
							</Badge>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</Sheet.Content>
</Sheet.Root>
