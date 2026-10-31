<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import { formatDate, formatTime, modeLabel, workoutTitle } from '#lib/log/labels.js';
	import { startedBeforeToday } from '#lib/log/rules.js';
	import type { Workout, WorkoutMode } from '#lib/log/types.js';

	/** El entrenamiento en curso en Hoy: su nombre o "Libre", la hora de inicio, el modo y "Terminar". */
	let {
		workout,
		now,
		onmode,
		onfinish
	}: {
		workout: Workout;
		now: Date;
		onmode: (mode: WorkoutMode) => Promise<void>;
		onfinish: () => Promise<void>;
	} = $props();

	let busy = $state(false);

	async function run(action: () => Promise<void>) {
		if (busy) return;
		busy = true;
		try {
			await action();
		} finally {
			busy = false;
		}
	}
</script>

<section aria-label="Entrenamiento en curso" class="mt-4 space-y-4 rounded-lg border p-4">
	<div class="flex items-baseline justify-between gap-3">
		<h2 class="text-xl">{workoutTitle(workout)}</h2>
		<p class="text-sm text-muted-foreground">Desde las {formatTime(workout.startedAt)}</p>
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
			value={workout.mode}
			onValueChange={(value) => {
				// Soltar el botón activo no deja el entrenamiento sin modo.
				if (value && value !== workout.mode) void run(() => onmode(value as WorkoutMode));
			}}
			class="justify-start"
		>
			{#each Object.entries(modeLabel) as [value, label] (value)}
				<ToggleGroup.Item {value} aria-label={label}>{label}</ToggleGroup.Item>
			{/each}
		</ToggleGroup.Root>
	</div>

	<Button variant="outline" class="w-full" disabled={busy} onclick={() => run(onfinish)}>
		Terminar
	</Button>
</section>
