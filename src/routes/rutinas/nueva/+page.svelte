<script lang="ts">
	import { goto } from '$app/navigation';
	import RoutineEditor from '#lib/components/RoutineEditor.svelte';
	import { createRoutine } from '#lib/log/routines.js';
	import { requestSync } from '#lib/sync/runtime.svelte.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Nueva rutina · Workout Logger</title>
</svelte:head>

<!-- Otra rutina base en la URL es otro editor: la copia se toma al crearlo. -->
{#key data.base?.id}
	<RoutineEditor
		mode="create"
		title="Nueva rutina"
		note={data.base ? `copia de ${data.base.name}` : undefined}
		initial={data.draft}
		onsave={async (draft) => {
			await createRoutine(draft);
			requestSync();
			await goto('/rutinas');
		}}
	/>
{/key}
