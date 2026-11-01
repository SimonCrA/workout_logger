<script lang="ts">
	import { Label } from '#lib/components/ui/label/index.js';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import { elapsedSeconds } from '#lib/log/companion.js';
	import {
		formatDate,
		formatElapsed,
		formatTime,
		modeLabel,
		workoutTitle
	} from '#lib/log/labels.js';
	import { startedBeforeToday } from '#lib/log/rules.js';
	import { isWorkoutMode, type Workout, type WorkoutMode } from '#lib/log/types.js';

	/** El encabezado del entrenamiento en curso en Hoy: su nombre o "Libre", la hora de inicio (y, con acompañamiento, cuánto va) y el modo. */
	let {
		workout,
		now,
		onmode
	}: {
		workout: Workout;
		now: Date;
		onmode: (mode: WorkoutMode) => Promise<void>;
	} = $props();

	let busy = $state(false);
	// Lo que marca el control: el modo guardado, que se adelanta al pulsar y vuelve si no se guarda nada.
	let mode = $derived(workout.mode);
	// Cuánto va, solo con acompañamiento: en solo registrar las horas no significan nada (ADR-0006).
	const elapsed = $derived(
		workout.mode === 'companion' ? formatElapsed(elapsedSeconds(workout.startedAt, now)) : null
	);

	async function pickMode(value: string) {
		// Soltar el botón activo o repetir el modo no cambia nada: el control vuelve al modo guardado.
		if (!isWorkoutMode(value) || value === workout.mode) {
			mode = workout.mode;
			return;
		}
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

<header class="space-y-4">
	<div class="flex items-baseline justify-between gap-3">
		<h2 class="text-xl">{workoutTitle(workout)}</h2>
		<p class="text-sm text-muted-foreground">
			Desde las {formatTime(workout.startedAt)}{elapsed === null ? '' : ` · ${elapsed}`}
		</p>
	</div>

	{#if startedBeforeToday(workout.startedAt, now)}
		<p role="status" class="rounded-md bg-warning/30 px-3 py-2 text-sm text-warning-content">
			Empezó el {formatDate(workout.startedAt)} y sigue en curso. Termínalo antes de registrar lo de hoy.
		</p>
	{/if}

	<div class="space-y-2">
		<Label id="workout-mode">Modo</Label>
		<ToggleGroup.Root
			type="single"
			variant="outline"
			aria-labelledby="workout-mode"
			bind:value={mode}
			disabled={busy}
			onValueChange={(value) => void pickMode(value)}
			class="justify-start"
		>
			{#each Object.entries(modeLabel) as [value, label] (value)}
				<ToggleGroup.Item {value} aria-label={label}>{label}</ToggleGroup.Item>
			{/each}
		</ToggleGroup.Root>
	</div>
</header>
