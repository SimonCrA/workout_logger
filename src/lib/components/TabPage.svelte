<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * Página de primer nivel (una pestaña, o Historial): título, una línea opcional encima (la fecha
	 * en Hoy), acciones opcionales a su derecha y, mientras no haya contenido, un texto de relleno.
	 */
	let {
		title,
		overline,
		actions,
		empty,
		children
	}: {
		title: string;
		overline?: string;
		actions?: Snippet;
		empty?: string;
		children?: Snippet;
	} = $props();
</script>

<svelte:head>
	<title>{title} · Workout Logger</title>
</svelte:head>

<header class="flex items-end justify-between gap-3">
	<div class="min-w-0">
		{#if overline}
			<p class="text-xs tracking-wider text-muted-foreground uppercase">{overline}</p>
		{/if}
		<h1 class="text-2xl">{title}</h1>
	</div>
	{@render actions?.()}
</header>
{#if empty}
	<p class="mt-4 text-muted-foreground">{empty}</p>
{/if}
{@render children?.()}
