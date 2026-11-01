<script lang="ts">
	import { untrack } from 'svelte';
	import * as AlertDialog from '#lib/components/ui/alert-dialog/index.js';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import { startModeLabel } from '#lib/log/labels.js';
	import { isWorkoutMode, WORKOUT_MODES, type WorkoutMode } from '#lib/log/types.js';

	/**
	 * La pregunta al Empezar una rutina (spec #10): "¿Cómo quieres entrenar?", con la última
	 * elección preseleccionada. `onstart` recibe el modo; quien abre el diálogo empieza el
	 * entrenamiento y se va a Hoy.
	 */
	let {
		open = $bindable(false),
		routineName,
		lastMode,
		onstart
	}: {
		open?: boolean;
		routineName: string;
		lastMode: WorkoutMode;
		onstart: (mode: WorkoutMode) => Promise<void>;
	} = $props();

	let chosen = $state<WorkoutMode>(untrack(() => lastMode));
	// Lo que marca el control; soltar el botón activo no deja la pregunta sin respuesta.
	let value = $state<string>(untrack(() => lastMode));
	let busy = $state(false);

	$effect(() => {
		// Cada apertura parte de la última elección.
		if (open) {
			chosen = lastMode;
			value = lastMode;
		}
	});

	function pick(next: string) {
		if (isWorkoutMode(next)) chosen = next;
		else value = chosen;
	}

	async function start() {
		busy = true;
		try {
			await onstart(chosen);
			open = false;
		} finally {
			busy = false;
		}
	}
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>¿Cómo quieres entrenar?</AlertDialog.Title>
			<AlertDialog.Description>
				{routineName}: con el tiempo y el descanso a la vista, o solo anotando series.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<ToggleGroup.Root
			type="single"
			variant="outline"
			aria-label="Modo"
			bind:value
			disabled={busy}
			onValueChange={pick}
			class="justify-start"
		>
			{#each WORKOUT_MODES as mode (mode)}
				<ToggleGroup.Item value={mode} aria-label={startModeLabel[mode]}>
					{startModeLabel[mode]}
				</ToggleGroup.Item>
			{/each}
		</ToggleGroup.Root>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={busy}>Cancelar</AlertDialog.Cancel>
			<AlertDialog.Action disabled={busy} onclick={start}>Empezar</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
