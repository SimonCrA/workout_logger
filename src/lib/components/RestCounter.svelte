<script lang="ts">
	import { secondClock } from '#lib/log/clock.svelte.js';
	import { restReached, restSeconds } from '#lib/log/companion.js';
	import { formatRest } from '#lib/log/labels.js';

	/**
	 * Descanso (GLOSSARY): cuánto va desde la última serie del entrenamiento, al segundo. Cambia
	 * de color al llegar al sugerido por la rutina, si lo hay; no avisa ni suena.
	 * `panel`: la versión grande del panel oscuro de Hoy, con una barra que se llena hasta el
	 * sugerido y que al llegar se invierte a lima. `ring`: un anillo que se llena hasta el sugerido,
	 * con el tiempo dentro (la página del ejercicio); al llegar se rellena de azul.
	 */
	let {
		lastSetAt,
		suggested,
		variant = 'inline'
	}: {
		lastSetAt: string;
		suggested: number | null;
		variant?: 'inline' | 'panel' | 'ring';
	} = $props();

	const RADIUS = 40;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

	const clock = secondClock();
	const rest = $derived(restSeconds(lastSetAt, clock.now));
	const reached = $derived(restReached(rest, suggested));
	const filled = $derived(suggested ? Math.min(rest / suggested, 1) * 100 : 0);
</script>

{#if variant === 'ring'}
	<div role="timer" aria-label="Descanso" class="relative size-24 shrink-0">
		<svg viewBox="0 0 96 96" class="size-24 -rotate-90" aria-hidden="true">
			<circle
				cx="48"
				cy="48"
				r={RADIUS}
				fill={reached ? 'var(--primary)' : 'none'}
				stroke="var(--base-300)"
				stroke-width="8"
				class="transition-[fill] duration-500 motion-reduce:transition-none"
			/>
			{#if suggested !== null && !reached}
				<circle
					cx="48"
					cy="48"
					r={RADIUS}
					fill="none"
					stroke="var(--primary)"
					stroke-width="8"
					stroke-linecap="round"
					stroke-dasharray={CIRCUMFERENCE}
					stroke-dashoffset={CIRCUMFERENCE * (1 - filled / 100)}
					class="transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none"
				/>
			{/if}
		</svg>
		<span class="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
			<span
				class={[
					'text-2xl leading-none tabular-nums',
					reached ? 'text-primary-foreground' : 'text-primary'
				]}
			>
				{formatRest(rest)}
			</span>
			<span class={['text-[10px]', reached ? 'text-primary-foreground' : 'text-muted-foreground']}>
				{suggested === null ? 'descanso' : `de ${formatRest(suggested)}`}
			</span>
		</span>
	</div>
{:else if variant === 'panel'}
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
