<script lang="ts">
	import type { Snippet } from 'svelte';
	import { inactiveMuscles, viewFor, type Muscle, type View } from '#lib/catalog/index.js';
	import BodyMap from '#lib/components/BodyMap.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import MuscleSheet from '#lib/components/MuscleSheet.svelte';
	import WeekCard from '#lib/components/WeekCard.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { dashboard, heatIntensity, LEGEND_MARKS, MAINTENANCE_SETS } from '#lib/log/dashboard.js';
	import {
		formatCount,
		relativeDayLabel,
		workoutSummaryLabel,
		workoutTitle
	} from '#lib/log/labels.js';
	import { live } from '#lib/log/live.svelte.js';
	import { liveWorkoutHistory } from '#lib/log/workouts.js';

	/**
	 * Hoy, en el orden en que ayuda a decidir qué entrenar: los menos trabajados, el mapa de calor
	 * de los últimos 7 días, la semana en números y el último entrenamiento. Con un entrenamiento en curso, la página lo pasa en `inProgress` y ocupa el
	 * lugar de "Menos trabajados"; `currentId` lo aparta del último entrenamiento.
	 */
	let {
		now,
		inProgress,
		currentId = null
	}: { now: Date; inProgress?: Snippet; currentId?: string | null } = $props();

	// El historial vivo desde IndexedDB; la consulta solo existe mientras se muestra el dashboard.
	const history = live(() => liveWorkoutHistory());
	const data = $derived(dashboard(history.value ?? [], now, currentId));
	const inactive = inactiveMuscles();
	const toWorkHint = `menos de ${MAINTENANCE_SETS} series en 7 días`;
	const maintenance = `/${MAINTENANCE_SETS}`;

	// La leyenda: la misma escala que el mapa, con una parada en cada marca.
	const percent = (mark: number) => Math.round(heatIntensity(mark) * 100);
	const scale = `linear-gradient(to right, ${LEGEND_MARKS.map(
		(mark) =>
			`color-mix(in oklch, var(--secondary-foreground) ${percent(mark)}%, var(--base-300)) ${percent(mark)}%`
	).join(', ')})`;
	const markStyle = (mark: number, index: number) =>
		index === 0
			? 'left: 0'
			: index === LEGEND_MARKS.length - 1
				? 'right: 0'
				: `left: ${percent(mark)}%; transform: translateX(-50%)`;

	const views: { view: View; label: string }[] = [
		{ view: 'front', label: 'Frente' },
		{ view: 'back', label: 'Espalda' }
	];

	let view = $state<View>('front');
	let selected = $state<Muscle | null>(null);
	let sheetOpen = $state(false);

	function select(muscle: Muscle) {
		selected = muscle;
		view = viewFor(muscle, view);
		sheetOpen = true;
	}
</script>

{#if history.value === undefined}
	<p class="mt-4 text-muted-foreground">Cargando…</p>
{:else}
	{#if inProgress}
		{@render inProgress()}
	{:else}
		<section aria-labelledby="to-work-title" class="mt-6">
			<div class="flex items-baseline justify-between gap-3">
				<h2 id="to-work-title" class="text-lg">Menos trabajados</h2>
				<span class="text-xs text-muted-foreground">{toWorkHint}</span>
			</div>
			{#if data.toWork.length > 0}
				<!-- Sale del relleno de la página (p-6) para que los chips se deslicen de borde a borde. -->
				<ul
					aria-label="Menos trabajados"
					class="-mx-6 mt-2 flex snap-x scroll-px-6 [scrollbar-width:none] gap-2 overflow-x-auto px-6 pb-1"
				>
					{#each data.toWork as { muscle, sets, progress } (muscle.code)}
						<li class="shrink-0 snap-start">
							<!-- El anillo se llena en el naranja del mapa con la parte de mantenimiento que ya tiene. -->
							<button
								type="button"
								class="flex h-11 items-center gap-2 rounded-full border bg-white pr-3.5 pl-1.5 text-sm whitespace-nowrap active:bg-muted"
								onclick={() => select(muscle)}
							>
								<span
									class="grid size-8 place-items-center rounded-full"
									style="background: conic-gradient(var(--secondary-foreground) {Math.round(
										progress * 360
									)}deg, var(--base-300) 0)"
									aria-hidden="true"
								>
									<span class="size-5.5 rounded-full bg-white"></span>
								</span>
								<span class="text-primary">{muscle.name}</span>
								<span class="text-muted-foreground tabular-nums"
									>{formatCount(sets)}{maintenance}</span
								>
							</button>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-2 text-sm text-muted-foreground">
					Ninguno: todos los músculos llegan a mantenimiento.
				</p>
			{/if}
		</section>
	{/if}

	<section aria-label="Mapa de calor" class="mt-6 rounded-2xl border bg-white p-3">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<h2 class="text-lg">Series por músculo</h2>
			<!-- El interruptor de vista: la pastilla blanca se desliza bajo la vista elegida; deslizar el mapa también la mueve. -->
			<div
				role="group"
				aria-label="Vista del mapa"
				class="relative grid w-44 grid-cols-2 rounded-full bg-muted p-1"
			>
				<span
					aria-hidden="true"
					class="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none {view ===
					'back'
						? 'translate-x-full'
						: ''}"
				></span>
				{#each views as option (option.view)}
					<button
						type="button"
						aria-pressed={view === option.view}
						class="relative min-h-9 rounded-full text-sm transition-colors {view === option.view
							? 'text-primary'
							: 'text-muted-foreground'}"
						onclick={() => (view = option.view)}
					>
						{option.label}
					</button>
				{/each}
			</div>
		</div>
		<div class="mx-auto mt-3 h-[44dvh] w-full max-w-sm">
			<BodyMap
				bind:view
				intensities={data.intensities}
				{inactive}
				interactive
				label="Mapa de calor"
				onselect={select}
			/>
		</div>
		<p class="mt-1 text-center text-xs text-muted-foreground">
			Toca un músculo; desliza para girar.
		</p>
		<figure class="mx-auto mt-3 max-w-sm" aria-label="Leyenda">
			<div class="h-2 rounded-full" style="background: {scale}"></div>
			<figcaption class="relative mt-1 h-4 text-xs text-muted-foreground">
				{#each LEGEND_MARKS as mark, index (mark)}
					<span class="absolute" style={markStyle(mark, index)}>{mark}</span>
				{/each}
			</figcaption>
		</figure>
	</section>

	<div class="mt-6">
		<WeekCard week={data.week} days={data.days} />
	</div>

	<section aria-labelledby="last-title" class="mt-6">
		<div class="flex items-center justify-between gap-3">
			<h2 id="last-title" class="text-lg">Último entrenamiento</h2>
			<Button href="/historial" variant="ghost" size="sm" class="-mr-2.5">
				<Icon name="calendar" class="size-4" />
				Historial
			</Button>
		</div>
		{#if data.last}
			{@const last = data.last}
			<a
				href="/historial/{last.workout.id}"
				class="mt-2 flex items-center gap-3 rounded-xl bg-muted p-3 active:bg-base-300"
			>
				<span
					class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary"
				>
					<Icon name="dumbbell" class="size-5" />
				</span>
				<span class="min-w-0 flex-1">
					<span class="block text-xs text-muted-foreground">
						{relativeDayLabel(last.workout.startedAt, now)}
					</span>
					<span class="block truncate text-primary">{workoutTitle(last.workout)}</span>
					<span class="block text-sm text-muted-foreground">
						{workoutSummaryLabel(last.exercises, last.sets)}
					</span>
				</span>
				<Icon name="chevron-right" class="size-5 shrink-0 text-muted-foreground" />
			</a>
		{:else}
			<p class="mt-2 text-muted-foreground">Todavía no hay entrenamientos.</p>
		{/if}
	</section>

	<MuscleSheet muscle={selected} bind:open={sheetOpen} />
{/if}
