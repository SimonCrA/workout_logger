<script lang="ts">
	import type { Exercise } from '#lib/catalog/index.js';
	import { setChanges, setFieldValues, type SetFieldValues } from '#lib/log/rules.js';
	import type { NewSet } from '#lib/log/sets.js';
	import type { WorkoutMode } from '#lib/log/types.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import SetFields from './SetFields.svelte';
	import Stepper from './Stepper.svelte';

	/**
	 * El registro de una serie en un toque: reps y peso prellenados, RIR (preseleccionado con el
	 * objetivo de la rutina), tipo y nota opcionales. En solo registrar, un control "Series" anota
	 * varias series iguales de una vez.
	 */
	let {
		exercise,
		prefillReps,
		prefillWeight,
		prefillRir = null,
		mode,
		onregister
	}: {
		exercise: Exercise;
		prefillReps: number;
		prefillWeight: number;
		prefillRir?: number | null;
		mode: WorkoutMode;
		onregister: (set: NewSet, count: number) => Promise<void>;
	} = $props();

	let count = $state(1);
	let values = $state<SetFieldValues>(
		setFieldValues({ reps: 0, weight: 0, rir: null, type: 'normal', note: null })
	);
	let saving = $state(false);

	const bulk = $derived(mode === 'log');
	const rirDefault = $derived(prefillRir === null ? '' : String(prefillRir));
	const submitLabel = $derived(bulk && count > 1 ? `Registrar ${count} series` : 'Registrar serie');

	// El punto de partida cambia solo cuando cambia la última serie registrada o la rutina, no con cada lectura.
	$effect(() => {
		values.reps = prefillReps;
	});
	$effect(() => {
		values.weight = prefillWeight;
	});
	$effect(() => {
		values.rir = rirDefault;
	});
	// Al pasar a acompañamiento el control se va; cuando vuelva, vuelve a una.
	$effect(() => {
		if (!bulk) count = 1;
	});

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		if (values.reps < 1 || saving) return;
		saving = true;
		try {
			await onregister({ exerciseId: exercise.id, ...setChanges(values) }, bulk ? count : 1);
			// Cada serie nueva arranca con los valores por defecto: una, normal, el RIR objetivo, sin nota.
			count = 1;
			values.type = 'normal';
			values.rir = rirDefault;
			values.note = '';
		} finally {
			saving = false;
		}
	}
</script>

<form {onsubmit} class="space-y-4">
	{#if bulk}
		<Stepper id="count" label="Series" step={1} min={1} bind:value={count} />
	{/if}
	<SetFields idPrefix="new" loadMode={exercise.loadMode} bind:values />

	<Button type="submit" size="lg" class="w-full" disabled={values.reps < 1 || saving}>
		{submitLabel}
	</Button>
</form>
