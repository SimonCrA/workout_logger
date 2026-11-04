<script lang="ts">
	import type { Snippet } from 'svelte';
	import { elapsedSeconds, hasTimes } from '#lib/log/companion.js';
	import {
		formatDate,
		formatElapsed,
		formatTime,
		modeLabel,
		workoutTitle
	} from '#lib/log/labels.js';
	import { startedBeforeToday } from '#lib/log/rules.js';
	import { WORKOUT_MODES, type Workout, type WorkoutMode } from '#lib/log/types.js';

	/**
	 * El encabezado del entrenamiento en curso en Hoy: un panel oscuro con su nombre o "Libre", la
	 * hora de inicio (y, con acompañamiento, cuánto va) y lo que la página ponga en `rest` (el
	 * descanso); debajo, el modo como interruptor.
	 */
	let {
		workout,
		now,
		onmode,
		rest
	}: {
		workout: Workout;
		now: Date;
		onmode: (mode: WorkoutMode) => Promise<void>;
		rest?: Snippet;
	} = $props();

	let busy = $state(false);
	// Lo que marca el control: el modo guardado, que se adelanta al pulsar y vuelve si no se guarda nada.
	let mode = $derived(workout.mode);
	// Cuánto va, solo con acompañamiento: en solo registrar las horas no significan nada (ADR-0006).
	const elapsed = $derived(
		hasTimes(workout.mode) ? formatElapsed(elapsedSeconds(workout.startedAt, now)) : null
	);
	const since = $derived(
		`Desde las ${formatTime(workout.startedAt)}${elapsed === null ? '' : ` · ${elapsed}`}`
	);

	async function pickMode(value: WorkoutMode) {
		if (value === workout.mode) return;
		mode = value;
		busy = true;
		try {
			await onmode(value);
		} catch (error) {
			mode = workout.mode;
			console.error('No se pudo cambiar el modo', error);
		} finally {
			busy = false;
		}
	}
</script>

<header>
	<div class="space-y-4 bg-primary p-4 text-base-100">
		<div class="flex items-baseline justify-between gap-3">
			<h2 class="min-w-0 truncate text-xl">{workoutTitle(workout)}</h2>
			<p class="shrink-0 text-sm text-base-300/75">{since}</p>
		</div>

		{#if startedBeforeToday(workout.startedAt, now)}
			<p role="status" class="rounded-md bg-warning px-3 py-2 text-sm text-warning-content">
				Empezó el {formatDate(workout.startedAt)} y sigue en curso. Termínalo antes de registrar lo de
				hoy.
			</p>
		{/if}

		{@render rest?.()}
	</div>

	<!-- El modo: radios reales bajo una pastilla que se desliza a la opción elegida. -->
	<fieldset class="px-4 pt-4" disabled={busy}>
		<legend class="sr-only">Modo</legend>
		<div class="relative grid grid-cols-2 rounded-full bg-muted p-1">
			<span
				aria-hidden="true"
				class="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none {mode ===
				'log'
					? 'translate-x-full'
					: ''}"
			></span>
			{#each WORKOUT_MODES as value (value)}
				<label
					class="relative flex min-h-9 items-center justify-center rounded-full px-2 text-sm transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring {mode ===
					value
						? 'text-primary'
						: 'text-muted-foreground'}"
				>
					<input
						type="radio"
						name="workout-mode"
						{value}
						checked={mode === value}
						onchange={() => void pickMode(value)}
						class="absolute inset-0 cursor-pointer appearance-none rounded-full opacity-0"
					/>
					{modeLabel[value]}
				</label>
			{/each}
		</div>
	</fieldset>
</header>
