<script lang="ts">
	import { goto } from '$app/navigation';
	import RoutineEditor from '#lib/components/RoutineEditor.svelte';
	import { live } from '#lib/log/live.svelte.js';
	import { draftOf, type RoutineDraft } from '#lib/log/routine-rules.js';
	import { deleteRoutine, liveRoutine, updateRoutine } from '#lib/log/routines.js';
	import { requestSync } from '#lib/sync/runtime.svelte.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const routine = live(() => liveRoutine(data.id));
	// La copia del editor se toma una vez, al llegar la rutina: lo que baje de otro dispositivo
	// mientras se edita no la pisa, y borrarla no desmonta el editor antes de salir.
	let initial = $state<RoutineDraft | undefined>();
	$effect(() => {
		if (routine.value && !initial) initial = draftOf(routine.value);
	});
	const title = $derived(initial?.name ?? routine.value?.name ?? 'Rutina');
</script>

<svelte:head>
	<title>{title} · Workout Logger</title>
</svelte:head>

<a href="/rutinas" class="inline-block py-2 text-sm text-muted-foreground">← Rutinas</a>

{#if initial}
	<h1 class="mt-2 text-2xl">{initial.name}</h1>
	<RoutineEditor
		{initial}
		onsave={async (draft) => {
			await updateRoutine(data.id, draft);
			requestSync();
			await goto('/rutinas');
		}}
		ondelete={async () => {
			await deleteRoutine(data.id);
			requestSync();
			await goto('/rutinas');
		}}
	/>
{:else if routine.value === undefined}
	<p class="mt-4 text-muted-foreground">Cargando…</p>
{:else}
	<h1 class="mt-2 text-2xl">No existe esa rutina</h1>
	<p class="mt-2 text-muted-foreground">Puede que se haya borrado desde otro dispositivo.</p>
{/if}
