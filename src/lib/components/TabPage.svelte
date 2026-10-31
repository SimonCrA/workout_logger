<script lang="ts">
	import type { Snippet } from 'svelte';

	/** Página de primer nivel (una pestaña, o Historial): título y, mientras no haya contenido, un texto de relleno. */
	let { title, empty, children }: { title: string; empty?: string; children?: Snippet } = $props();
</script>

<svelte:head>
	<title>{title} · Workout Logger</title>
</svelte:head>

<h1 class="text-2xl">{title}</h1>
{#if empty}
	<p class="mt-4 text-muted-foreground">{empty}</p>
{/if}
{@render children?.()}
