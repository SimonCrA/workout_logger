<script lang="ts">
	import type { Exercise } from '#lib/catalog/index.js';
	import { setTypeLabel, weightLabel } from '#lib/log/labels.js';
	import type { NewSet } from '#lib/log/sets.js';
	import type { SetType } from '#lib/log/types.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import Stepper from './Stepper.svelte';

	/** El registro de una serie en un toque: reps y peso prellenados, RIR, tipo y nota opcionales. */
	let {
		exercise,
		prefillReps,
		prefillWeight,
		onregister
	}: {
		exercise: Exercise;
		prefillReps: number;
		prefillWeight: number;
		onregister: (set: NewSet) => Promise<void>;
	} = $props();

	let reps = $state(0);
	let weight = $state(0);
	let type = $state<SetType>('normal');
	let rir = $state('');
	let note = $state('');
	let saving = $state(false);

	// El punto de partida cambia solo cuando cambia la última serie registrada, no con cada lectura.
	$effect(() => {
		reps = prefillReps;
	});
	$effect(() => {
		weight = prefillWeight;
	});

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		if (reps < 1 || saving) return;
		saving = true;
		try {
			await onregister({
				exerciseId: exercise.id,
				reps,
				weight,
				rir: rir === '' ? null : Number(rir),
				type,
				note: note.trim() === '' ? null : note.trim()
			});
			// Cada serie nueva arranca con los valores por defecto: normal, sin RIR, sin nota.
			type = 'normal';
			rir = '';
			note = '';
		} finally {
			saving = false;
		}
	}
</script>

<form {onsubmit} class="space-y-4">
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

	<Button type="submit" size="lg" class="w-full" disabled={reps < 1 || saving}
		>Registrar serie</Button
	>
</form>
