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
	import SegmentedSwitch from '#lib/components/SegmentedSwitch.svelte';

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

	const modeOptions = WORKOUT_MODES.map((value) => ({ value, label: modeLabel[value] }));

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

	<div class="px-4 pt-4">
		<SegmentedSwitch
			legend="Modo"
			name="workout-mode"
			options={modeOptions}
			value={mode}
			disabled={busy}
			onchange={(value) => void pickMode(value)}
		/>
	</div>
</header>
