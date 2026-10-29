<script lang="ts">
	import { untrack } from 'svelte';
	import {
		exercisesOf,
		muscles,
		oppositeView,
		searchCatalog,
		viewFor,
		type Muscle,
		type View
	} from '#lib/catalog/index.js';
	import BodyMap, { type Highlight } from '#lib/components/BodyMap.svelte';
	import ExerciseRow from '#lib/components/ExerciseRow.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import MuscleSheet from '#lib/components/MuscleSheet.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';

	let query = $state('');
	let view = $state<View>('front');
	let selected = $state<Muscle | null>(null);
	let sheetOpen = $state(false);

	const results = $derived(searchCatalog(query));
	const inactive = muscles
		.filter((muscle) => {
			const { primary, secondary } = exercisesOf(muscle.code);
			return primary.length + secondary.length === 0;
		})
		.map((muscle) => muscle.code);
	const highlights = $derived.by((): Record<string, Highlight> => {
		if (selected) return { [selected.code]: 'strong' };
		return Object.fromEntries(results.muscles.map((muscle) => [muscle.code, 'strong']));
	});

	$effect(() => {
		// Escribir el nombre de un músculo gira el mapa hacia él, sin deshacer un giro manual posterior.
		const first = results.muscles[0];
		if (first)
			view = viewFor(
				first,
				untrack(() => view)
			);
	});

	function select(muscle: Muscle) {
		selected = muscle;
		view = viewFor(muscle, view);
		sheetOpen = true;
	}

	function flip() {
		view = oppositeView(view);
	}
</script>

<svelte:head>
	<title>Ejercicios · Workout Logger</title>
</svelte:head>

<h1 class="text-2xl">Ejercicios</h1>

<div class="mt-4 flex gap-2">
	<Input
		type="search"
		placeholder="Músculo o ejercicio"
		aria-label="Buscar músculo o ejercicio"
		autocomplete="off"
		bind:value={query}
		oninput={() => (selected = null)}
	/>
	<Button variant="outline" size="icon" aria-label="Girar el mapa" onclick={flip}>
		<Icon name="refresh" class="size-5" />
	</Button>
</div>

{#if query.trim() !== ''}
	<section aria-label="Resultados" class="mt-4">
		{#if results.muscles.length === 0 && results.exercises.length === 0}
			<p class="text-muted-foreground">Nada con ese nombre.</p>
		{/if}
		{#if results.muscles.length > 0}
			<h2 class="text-sm text-muted-foreground">Músculos</h2>
			<ul class="divide-y">
				{#each results.muscles as muscle (muscle.code)}
					<li>
						<button
							type="button"
							class="w-full py-3 text-left active:bg-muted"
							onclick={() => select(muscle)}
						>
							{muscle.name}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
		{#if results.exercises.length > 0}
			<h2 class="mt-3 text-sm text-muted-foreground">Ejercicios</h2>
			<ul class="divide-y">
				{#each results.exercises as exercise (exercise.id)}
					<ExerciseRow {exercise} />
				{/each}
			</ul>
		{/if}
	</section>
{/if}

<div class="mx-auto mt-4 h-[60dvh] max-w-sm">
	<BodyMap bind:view {highlights} {inactive} interactive onselect={select} />
</div>
<p class="mt-2 text-center text-xs text-muted-foreground">
	Vista {view === 'front' ? 'frontal' : 'posterior'}. Toca un músculo; desliza para girar.
</p>

<MuscleSheet muscle={selected} bind:open={sheetOpen} />
