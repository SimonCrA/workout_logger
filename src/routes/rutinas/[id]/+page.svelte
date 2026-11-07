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
	// La copia del editor se toma una vez por rutina, al llegar: lo que baje de otro dispositivo
	// mientras se edita no la pisa, y borrarla no desmonta el editor antes de salir.
	let initial = $state<{ id: string; draft: RoutineDraft } | undefined>();
	$effect(() => {
		if (routine.value && initial?.id !== data.id)
			initial = { id: data.id, draft: draftOf(routine.value) };
	});
	const title = $derived(initial?.draft.name ?? routine.value?.name ?? 'Rutina');

	async function save(draft: RoutineDraft) {
		const saved = await updateRoutine(data.id, draft);
		if (!saved)
			throw new Error('Esta rutina se borró desde otro dispositivo: ya no se puede guardar.');
		requestSync();
		await goto('/rutinas');
	}

	async function remove() {
		await deleteRoutine(data.id);
		requestSync();
		await goto('/rutinas');
	}
</script>

<svelte:head>
	<title>{title} · Workout Logger</title>
</svelte:head>

{#if initial}
	{#key initial.id}
		<RoutineEditor
			mode="edit"
			title="Editar rutina"
			initial={initial.draft}
			onsave={save}
			ondelete={remove}
		/>
	{/key}
{:else if routine.value === undefined}
	<p class="mt-4 text-muted-foreground">Cargando…</p>
{:else}
	<a href="/rutinas" class="inline-block py-2 text-sm text-muted-foreground">← Rutinas</a>
	<h1 class="mt-2 text-2xl">No existe esa rutina</h1>
	<p class="mt-2 text-muted-foreground">Puede que se haya borrado desde otro dispositivo.</p>
{/if}
