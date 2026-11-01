<script lang="ts">
	import { secondClock } from '#lib/log/clock.svelte.js';
	import { restReached, restSeconds } from '#lib/log/companion.js';
	import { formatRest } from '#lib/log/labels.js';

	/**
	 * Descanso (GLOSSARY): cuánto va desde la última serie del entrenamiento, al segundo. Cambia
	 * de color al llegar al sugerido por la rutina, si lo hay; no avisa ni suena.
	 */
	let { lastSetAt, suggested }: { lastSetAt: string; suggested: number | null } = $props();

	const clock = secondClock();
	const rest = $derived(restSeconds(lastSetAt, clock.now));
	const reached = $derived(restReached(rest, suggested));
</script>

<p
	role="timer"
	aria-label="Descanso"
	class={[
		'flex items-baseline gap-2 rounded-md px-3 py-2',
		reached ? 'bg-success/40 text-success-content' : 'bg-muted'
	]}
>
	<span class="text-sm">Descanso</span>
	<span class="text-2xl tabular-nums">{formatRest(rest)}</span>
	{#if suggested !== null}
		<span class="text-sm text-muted-foreground">de {formatRest(suggested)}</span>
	{/if}
</p>
