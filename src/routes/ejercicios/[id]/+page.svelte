<script lang="ts">
	import { untrack } from 'svelte';
	import {
		equipmentLabel,
		getMuscle,
		loadModeLabel,
		oppositeView,
		viewFor,
		type View
	} from '#lib/catalog/index.js';
	import BodyMap, { type Highlight } from '#lib/components/BodyMap.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const exercise = $derived(data.exercise);
	const primary = $derived(getMuscle(exercise.primaryMuscle));
	const secondaries = $derived(
		exercise.secondaryMuscles.map((code) => getMuscle(code)?.name).filter((name) => name)
	);
	const highlights = $derived.by((): Record<string, Highlight> => ({
		...Object.fromEntries(exercise.secondaryMuscles.map((code) => [code, 'faint'])),
		[exercise.primaryMuscle]: 'strong'
	}));
	// El mini mapa abre por la vista donde está el primario y vuelve a ella al cambiar de ejercicio.
	let view = $state<View>(untrack(() => (primary ? viewFor(primary, 'front') : 'front')));
	$effect(() => {
		if (primary) view = viewFor(primary, 'front');
	});
</script>

<svelte:head>
	<title>{exercise.name} · Workout Logger</title>
</svelte:head>

<a href="/ejercicios" class="inline-block py-2 text-sm text-muted-foreground">← Ejercicios</a>
<h1 class="mt-2 text-2xl">{exercise.name}</h1>
<p class="mt-2 text-muted-foreground">{exercise.description}</p>

<dl class="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
	<dt class="text-muted-foreground">Equipo</dt>
	<dd>{equipmentLabel[exercise.equipment]}</dd>
	<dt class="text-muted-foreground">Modo de carga</dt>
	<dd>{loadModeLabel[exercise.loadMode]}</dd>
	<dt class="text-muted-foreground">Primario</dt>
	<dd>{primary?.name}</dd>
	<dt class="text-muted-foreground">Secundarios</dt>
	<dd>{secondaries.length > 0 ? secondaries.join(', ') : 'Ninguno'}</dd>
</dl>

<div class="mt-6 flex items-start justify-center gap-2">
	<div class="h-72 w-44">
		<BodyMap bind:view {highlights} label="Mini mapa" />
	</div>
	<Button
		variant="ghost"
		size="icon"
		aria-label="Girar el mapa"
		onclick={() => (view = oppositeView(view))}
	>
		<Icon name="refresh" class="size-5" />
	</Button>
</div>
