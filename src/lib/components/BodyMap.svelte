<script lang="ts" module>
	/** `strong`: el músculo seleccionado o primario; `faint`: un secundario. */
	export type Highlight = 'strong' | 'faint';
</script>

<script lang="ts">
	import { bodyMapSvg } from '#lib/body-map/svg.js';
	import { muscleOfRegion, type Muscle, type View } from '#lib/catalog/index.js';

	let {
		view = $bindable('front'),
		highlights = {},
		inactive = [],
		interactive = false,
		label = 'Mapa corporal',
		onselect
	}: {
		view?: View;
		/** Por código de músculo; se pintan todas sus regiones (ADR-0004). */
		highlights?: Record<string, Highlight>;
		/** Códigos de músculos sin ejercicios. */
		inactive?: readonly string[];
		/** Tocar una región selecciona su músculo y deslizar gira el mapa. */
		interactive?: boolean;
		label?: string;
		onselect?: (muscle: Muscle) => void;
	} = $props();

	let container: HTMLDivElement;
	let swipeStart: { x: number; y: number } | null = null;
	let swiped = false;

	$effect(() => {
		// El SVG entra con {@html}, así que sus regiones se marcan a mano.
		for (const region of container.querySelectorAll<SVGElement>('.muscle')) {
			const muscle = muscleOfRegion(region.id);
			const level = muscle ? highlights[muscle.code] : undefined;
			if (level) region.dataset.highlight = level;
			else delete region.dataset.highlight;
			if (muscle && inactive.includes(muscle.code)) region.dataset.inactive = '';
			else delete region.dataset.inactive;
		}
	});

	function onpointerdown(event: PointerEvent) {
		swipeStart = { x: event.clientX, y: event.clientY };
	}

	function onpointerup(event: PointerEvent) {
		if (!swipeStart || !interactive) return;
		const dx = event.clientX - swipeStart.x;
		const dy = event.clientY - swipeStart.y;
		swipeStart = null;
		if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
			view = view === 'front' ? 'back' : 'front';
			swiped = true;
		}
	}

	function onclick(event: MouseEvent) {
		if (swiped) {
			swiped = false;
			return;
		}
		if (!interactive) return;
		const region = (event.target as Element).closest('.muscle');
		const muscle = region && muscleOfRegion(region.id);
		if (muscle) onselect?.(muscle);
	}
</script>

<!-- Las regiones del SVG no son focalizables; el camino accesible es la búsqueda por nombre. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	bind:this={container}
	class="body-map h-full w-full"
	data-view={view}
	data-interactive={interactive || undefined}
	role="img"
	aria-label={label}
	{onpointerdown}
	{onpointerup}
	{onclick}
>
	{@html bodyMapSvg}
</div>

<style>
	.body-map {
		touch-action: pan-y;
		user-select: none;
	}
	.body-map :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
	}
	.body-map[data-view='front'] :global(#back-view),
	.body-map[data-view='back'] :global(#front-view) {
		display: none;
	}
	/* Colores heredados de la app Astro: contorno oscuro, músculos en los grises cálidos de silk. */
	.body-map :global(.outline-human) {
		fill: none;
		stroke: var(--foreground);
		stroke-width: 0.8px;
	}
	.body-map :global(.muscle) {
		fill: var(--base-300);
		stroke: color-mix(in oklch, var(--base-content) 25%, var(--base-300));
		stroke-width: 0.6px;
		stroke-linejoin: round;
		transition:
			fill 0.25s,
			stroke 0.25s;
	}
	.body-map[data-interactive] :global(.muscle) {
		cursor: pointer;
	}
	.body-map :global(.muscle[data-inactive]) {
		fill: var(--base-200);
		stroke: var(--border);
		stroke-dasharray: 1 1;
	}
	.body-map :global(.muscle[data-highlight='faint']) {
		fill: color-mix(in oklch, var(--primary) 35%, var(--base-300));
		stroke: var(--primary);
	}
	.body-map :global(.muscle[data-highlight='strong']) {
		fill: var(--primary);
		stroke: var(--primary);
		stroke-width: 1px;
	}
</style>
