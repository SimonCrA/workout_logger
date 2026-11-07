<script lang="ts">
	import type { Exercise } from '#lib/catalog/index.js';
	import { weightLabel } from '#lib/log/labels.js';
	import { setChanges, setFieldValues, type SetFieldValues } from '#lib/log/rules.js';
	import type { NewSet } from '#lib/log/sets.js';
	import type { WorkoutMode } from '#lib/log/types.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import BigStepper from './BigStepper.svelte';
	import SetOptions from './SetOptions.svelte';
	import Stepper from './Stepper.svelte';

	/**
	 * El registro de una serie en un toque: peso y reps en grande, prellenados con la última serie;
	 * "Igual que la anterior" los devuelve a ella si se cambiaron. Detrás de "RIR, tipo y nota", lo
	 * opcional (el RIR, preseleccionado con el objetivo de la rutina). En solo registrar, un control
	 * "Series" anota varias series iguales de una vez.
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
	let optionsOpen = $state(false);

	const bulk = $derived(mode === 'log');
	const rirDefault = $derived(prefillRir === null ? '' : String(prefillRir));
	const submitLabel = $derived(bulk && count > 1 ? `Registrar ${count} series` : 'Registrar serie');
	// Solo hay "anterior" si ya hubo una serie (el prellenado parte de ella).
	const hasPrevious = $derived(prefillReps > 0);
	const changed = $derived(values.reps !== prefillReps || values.weight !== prefillWeight);

	$effect(() => {
		values.reps = prefillReps;
	});
	$effect(() => {
		values.weight = prefillWeight;
	});
	$effect(() => {
		values.rir = rirDefault;
	});
	$effect(() => {
		if (!bulk) count = 1;
	});

	function sameAsBefore() {
		values.reps = prefillReps;
		values.weight = prefillWeight;
	}

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		if (values.reps < 1 || saving) return;
		saving = true;
		try {
			await onregister({ exerciseId: exercise.id, ...setChanges(values) }, bulk ? count : 1);
			count = 1;
			values.type = 'normal';
			values.rir = rirDefault;
			values.note = '';
		} finally {
			saving = false;
		}
	}
</script>

<form {onsubmit} class="space-y-4 rounded-3xl border bg-white px-4 pt-5 pb-4">
	{#if bulk}
		<Stepper id="count" label="Series" step={1} min={1} bind:value={count} />
		<div class="h-px bg-base-200"></div>
	{/if}
	<BigStepper
		id="new-weight"
		label={weightLabel[exercise.loadMode]}
		unit="kg"
		step={2.5}
		stepText="2,5"
		bind:value={values.weight}
	/>
	<div class="h-px bg-base-200"></div>
	<BigStepper id="new-reps" label="Reps" unit="reps" step={1} bind:value={values.reps} />

	<div class="flex flex-wrap justify-center gap-1.5">
		{#if hasPrevious}
			<button
				type="button"
				class="min-h-9 rounded-full border bg-background px-3 text-xs disabled:opacity-50"
				disabled={!changed}
				onclick={sameAsBefore}
			>
				Igual que la anterior
			</button>
		{/if}
		<button
			type="button"
			class="min-h-9 rounded-full border bg-background px-3 text-xs aria-expanded:border-primary aria-expanded:text-primary"
			aria-expanded={optionsOpen}
			aria-controls="set-options"
			onclick={() => (optionsOpen = !optionsOpen)}
		>
			RIR, tipo y nota
		</button>
	</div>
	<div id="set-options" class="rounded-2xl bg-background p-3" hidden={!optionsOpen}>
		<SetOptions idPrefix="new" bind:values />
	</div>

	<Button
		type="submit"
		size="lg"
		class="h-14 w-full text-base"
		disabled={values.reps < 1 || saving}
	>
		{submitLabel}
	</Button>
</form>
