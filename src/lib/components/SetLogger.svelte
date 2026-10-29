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
		prefill,
		onregister
	}: {
		exercise: Exercise;
		prefill: { reps: number; weight: number };
		onregister: (set: NewSet) => Promise<void>;
	} = $props();

	let reps = $state(0);
	let weight = $state(0);
	let type = $state<SetType>('normal');
	let rir = $state('');
	let note = $state('');
	let saving = $state(false);

	$effect(() => {
		// La última serie registrada (o la última vez) es el punto de partida de la siguiente.
		reps = prefill.reps;
		weight = prefill.weight;
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
			note = '';
		} finally {
			saving = false;
		}
	}
</script>

<form {onsubmit} class="space-y-4">
	<Stepper id="reps" label="Reps" step={1} bind:value={reps} />
	<Stepper id="weight" label={weightLabel[exercise.loadMode]} step={2.5} bind:value={weight} />

	<details class="group">
		<summary class="cursor-pointer text-sm text-muted-foreground select-none">Más opciones</summary>
		<div class="mt-3 space-y-4">
			<div class="space-y-2">
				<Label>Tipo de serie</Label>
				<ToggleGroup.Root type="single" variant="outline" bind:value={type} class="justify-start">
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
