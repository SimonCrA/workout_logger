<script lang="ts">
	import { secondClock } from '#lib/log/clock.svelte.js';
	import { restReached, restSeconds } from '#lib/log/companion.js';
	import { formatRest } from '#lib/log/labels.js';

	/**
	 * Descanso (GLOSSARY): cuánto va desde la última serie del entrenamiento, al segundo. Cambia
	 * de color al llegar al sugerido por la rutina, si lo hay; no avisa ni suena.
	 * `panel`: la versión grande del panel oscuro de Hoy, con una barra que se llena hasta el
	 * sugerido y que al llegar se invierte a lima.
	 */
	let {
		lastSetAt,
		suggested,
		variant = 'inline'
	}: { lastSetAt: string; suggested: number | null; variant?: 'inline' | 'panel' } = $props();

	const clock = secondClock();
	const rest = $derived(restSeconds(lastSetAt, clock.now));
	const reached = $derived(restReached(rest, suggested));
	const filled = $derived(suggested ? Math.min(rest / suggested, 1) * 100 : 0);
</script>

{#if variant === 'panel'}
	<div
		role="timer"
		aria-label="Descanso"
		class={[
			'rounded-xl p-3 transition-colors duration-500 motion-reduce:transition-none',
			reached ? 'bg-primary-foreground text-primary' : 'bg-white/8 text-base-300'
		]}
	>
		<span class="block text-sm">Descanso</span>
		<span class="mt-1 flex items-baseline gap-2">
			<span
				class={[
					'text-5xl leading-none tabular-nums',
					reached ? 'text-primary' : 'text-primary-foreground'
				]}
			>
				{formatRest(rest)}
			</span>
			{#if suggested !== null}
				<span class={['text-sm', !reached && 'text-base-300/70']}>de {formatRest(suggested)}</span>
			{/if}
		</span>
		{#if suggested !== null}
			<span class="mt-3 block h-1.5 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
				<span
					class={[
						'block h-full rounded-full transition-[width] duration-1000 ease-linear motion-reduce:transition-none',
						reached ? 'bg-primary' : 'bg-primary-foreground'
					]}
					style="width: {filled}%"
				></span>
			</span>
		{/if}
	</div>
{:else}
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
{/if}
