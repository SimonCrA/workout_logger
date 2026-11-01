<script lang="ts">
	import type { Exercise } from '#lib/catalog/index.js';
	import { setTypeLabel, weightLabel } from '#lib/log/labels.js';
	import type { NewSet } from '#lib/log/sets.js';
	import type { SetType, WorkoutMode } from '#lib/log/types.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
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
	let reps = $state(0);
	let weight = $state(0);
	let type = $state<SetType>('normal');
	let rir = $state('');
	let note = $state('');
	let saving = $state(false);

	const bulk = $derived(mode === 'log');
	const rirDefault = $derived(prefillRir === null ? '' : String(prefillRir));
	const submitLabel = $derived(bulk && count > 1 ? `Registrar ${count} series` : 'Registrar serie');

	// El punto de partida cambia solo cuando cambia la última serie registrada o la rutina, no con cada lectura.
	$effect(() => {
		reps = prefillReps;
	});
	$effect(() => {
		weight = prefillWeight;
	});
	$effect(() => {
		rir = rirDefault;
	});
	// Al pasar a acompañamiento el control se va; cuando vuelva, vuelve a una.
	$effect(() => {
		if (!bulk) count = 1;
	});

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		if (reps < 1 || saving) return;
		saving = true;
		try {
			await onregister(
				{
					exerciseId: exercise.id,
					reps,
					weight,
					rir: rir === '' ? null : Number(rir),
					type,
					note: note.trim() === '' ? null : note.trim()
				},
				bulk ? count : 1
			);
			// Cada serie nueva arranca con los valores por defecto: una, normal, el RIR objetivo, sin nota.
			count = 1;
			type = 'normal';
			rir = rirDefault;
			note = '';
		} finally {
			saving = false;
		}
	}
</script>

<form {onsubmit} class="space-y-4">
	{#if bulk}
		<Stepper id="count" label="Series" step={1} min={1} bind:value={count} />
	{/if}
	<Stepper id="reps" label="Reps" step={1} bind:value={reps} />
	<Stepper id="weight" label={weightLabel[exercise.loadMode]} step={2.5} bind:value={weight} />

	<details>
		<summary class="cursor-pointer text-sm text-muted-foreground select-none">Más opciones</summary>
		<div class="mt-3 space-y-4">
			<div class="space-y-2">
				<Label>Tipo de serie</Label>
				<ToggleGroup.Root
					type="single"
					variant="outline"
					value={type}
					onValueChange={(value) => (type = (value as SetType) || 'normal')}
					class="justify-start"
				>
					{#each Object.entries(setTypeLabel) as [value, label] (value)}
						<ToggleGroup.Item {value} aria-label={label}>{label}</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</div>
			<div class="space-y-2">
				<Label>RIR (opcional)</Label>
				<ToggleGroup.Root type="single" variant="outline" bind:value={rir} class="justify-start">
					{#each ['0', '1', '2', '3', '4'] as value (value)}
						<ToggleGroup.Item {value} aria-label="RIR {value}">{value}</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</div>
			<div class="space-y-2">
				<Label for="note">Nota (opcional)</Label>
				<Textarea id="note" rows={2} bind:value={note} placeholder="Lo que no cabe en un número" />
			</div>
		</div>
	</details>

	<Button type="submit" size="lg" class="w-full" disabled={reps < 1 || saving}>{submitLabel}</Button
	>
</form>
