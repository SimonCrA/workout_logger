<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * Página de primer nivel (una pestaña, o Historial): título, una línea opcional encima (la fecha
	 * en Hoy), acciones opcionales a su derecha y, mientras no haya contenido, un texto de relleno.
	 * Con `sticky`, la cabecera queda fija arriba al hacer scroll.
	 */
	let {
		title,
		overline,
		actions,
		empty,
		sticky = false,
		children
	}: {
		title: string;
		overline?: string;
		actions?: Snippet;
		empty?: string;
		sticky?: boolean;
		children?: Snippet;
	} = $props();
</script>

<svelte:head>
	<title>{title} · Workout Logger</title>
</svelte:head>

<!-- Fija, ocupa el ancho del <main> con su fondo y no se mueve de sitio: el margen negativo compensa su relleno. -->
<header
	class={[
		'flex items-end justify-between gap-3',
		sticky &&
			'sticky top-0 z-10 -mx-6 -mt-3 bg-background px-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3'
	]}
>
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
