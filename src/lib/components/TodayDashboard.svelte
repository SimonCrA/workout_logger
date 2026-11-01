<script lang="ts">
	import {
		inactiveMuscles,
		oppositeView,
		viewFor,
		type Muscle,
		type View
	} from '#lib/catalog/index.js';
	import BodyMap from '#lib/components/BodyMap.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import MuscleSheet from '#lib/components/MuscleSheet.svelte';
	import WeekCard from '#lib/components/WeekCard.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { dashboard, heatIntensity, LEGEND_MARKS } from '#lib/log/dashboard.js';
	import {
		relativeDayLabel,
		toWorkLine,
		workoutSummaryLabel,
		workoutTitle
	} from '#lib/log/labels.js';
	import { live } from '#lib/log/live.svelte.js';
	import { liveWorkoutHistory } from '#lib/log/workouts.js';

	/** Hoy sin entrenamiento en curso: el mapa de calor de los últimos 7 días, la semana en números y el último entrenamiento. */
	let { now }: { now: Date } = $props();

	// El historial vivo desde IndexedDB; la consulta solo existe mientras se muestra el dashboard.
	const history = live(() => liveWorkoutHistory());
	const data = $derived(dashboard(history.value ?? [], now));
	const inactive = inactiveMuscles();

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
	<section aria-label="Mapa de calor" class="mt-4">
		<div class="flex items-start justify-center gap-2">
			<div class="h-[50dvh] w-full max-w-sm">
				<BodyMap
					bind:view
					intensities={data.intensities}
					{inactive}
					interactive
					label="Mapa de calor"
					onselect={select}
				/>
			</div>
			<Button
				variant="ghost"
				size="icon"
				aria-label="Girar el mapa"
				onclick={() => (view = oppositeView(view))}
			>
				<Icon name="refresh" class="size-5" />
			</Button>
		</div>
		<p class="mt-1 text-center text-xs text-muted-foreground">
			Vista {view === 'front' ? 'frontal' : 'posterior'}. Toca un músculo; desliza para girar.
		</p>
		<figure class="mx-auto mt-3 max-w-sm" aria-label="Leyenda">
			<div class="h-3 rounded-full" style="background: {scale}"></div>
			<figcaption class="relative mt-1 h-4 text-xs text-muted-foreground">
				{#each LEGEND_MARKS as mark, index (mark)}
					<span class="absolute" style={markStyle(mark, index)}>{mark}</span>
				{/each}
			</figcaption>
		</figure>
		<p class="mt-3 text-sm">{toWorkLine(data.toWork)}</p>
	</section>

	<div class="mt-6">
		<WeekCard week={data.week} />
	</div>

	<section class="mt-6">
		<h2 class="text-lg">Último entrenamiento</h2>
		<div class="mt-1 flex items-center justify-between gap-3">
			{#if data.last}
				{@const last = data.last}
				<a href="/historial/{last.workout.id}" class="min-w-0 flex-1 py-2 active:bg-muted">
					<span class="block">
						{relativeDayLabel(last.workout.startedAt, now)} · {workoutTitle(last.workout)}
					</span>
					<span class="block text-sm text-muted-foreground">
						{workoutSummaryLabel(last.exercises, last.sets)}
					</span>
				</a>
			{:else}
				<p class="flex-1 text-muted-foreground">Todavía no hay entrenamientos.</p>
			{/if}
			<Button href="/historial" variant="outline" class="shrink-0">
				<Icon name="calendar" class="size-5" />
				Historial
			</Button>
		</div>
	</section>

	<div class="mt-6">
		<Button href="/ejercicios">
			<Icon name="add" class="size-5" />
			Entrenamiento libre
		</Button>
	</div>

	<MuscleSheet muscle={selected} bind:open={sheetOpen} />
{/if}
