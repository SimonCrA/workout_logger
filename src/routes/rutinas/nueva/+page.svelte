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

<a href="/rutinas" class="inline-block py-2 text-sm text-muted-foreground">← Rutinas</a>
<h1 class="mt-2 text-2xl">Nueva rutina</h1>
{#if data.base}
	<p class="mt-1 text-sm text-muted-foreground">Copia de {data.base.name}; cámbiala a tu gusto.</p>
{/if}

<!-- Otra rutina base en la URL es otro editor: la copia se toma al crearlo. -->
{#key data.base?.id}
	<RoutineEditor
		mode="create"
		initial={data.draft}
		onsave={async (draft) => {
			await createRoutine(draft);
			requestSync();
			await goto('/rutinas');
		}}
	/>
{/key}
