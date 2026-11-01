<script lang="ts">
	import type { LoadMode } from '#lib/catalog/index.js';
	import { setTypeLabel, weightLabel } from '#lib/log/labels.js';
	import type { SetFieldValues } from '#lib/log/rules.js';
	import type { SetType } from '#lib/log/types.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import Stepper from './Stepper.svelte';

	/**
	 * Los controles de una serie, los mismos al registrar y al corregir (spec #18): reps y peso
	 * según el modo de carga del ejercicio, nunca negativos, y bajo "Más opciones" el tipo, el RIR
	 * y la nota. `idPrefix` distingue los campos cuando hay dos juegos en la misma página.
	 */
	let {
		idPrefix,
		loadMode,
		values = $bindable(),
		expanded = false
	}: {
		idPrefix: string;
		loadMode: LoadMode;
		values: SetFieldValues;
		/** Con las opciones ya desplegadas: al corregir se ve todo lo que tiene la serie. */
		expanded?: boolean;
	} = $props();
</script>

<Stepper id="{idPrefix}-reps" label="Reps" step={1} bind:value={values.reps} />
<Stepper
	id="{idPrefix}-weight"
	label={weightLabel[loadMode]}
	step={2.5}
	bind:value={values.weight}
/>

<details open={expanded}>
	<summary class="cursor-pointer text-sm text-muted-foreground select-none">Más opciones</summary>
	<div class="mt-3 space-y-4">
		<div class="space-y-2">
			<Label>Tipo de serie</Label>
			<ToggleGroup.Root
				type="single"
				variant="outline"
				value={values.type}
				onValueChange={(value) => (values.type = (value as SetType) || 'normal')}
				class="justify-start"
			>
				{#each Object.entries(setTypeLabel) as [value, label] (value)}
					<ToggleGroup.Item {value} aria-label={label}>{label}</ToggleGroup.Item>
				{/each}
			</ToggleGroup.Root>
		</div>
		<div class="space-y-2">
			<Label>RIR (opcional)</Label>
			<ToggleGroup.Root
				type="single"
				variant="outline"
				bind:value={values.rir}
				class="justify-start"
			>
				{#each ['0', '1', '2', '3', '4'] as value (value)}
					<ToggleGroup.Item {value} aria-label="RIR {value}">{value}</ToggleGroup.Item>
				{/each}
			</ToggleGroup.Root>
		</div>
		<div class="space-y-2">
			<Label for="{idPrefix}-note">Nota (opcional)</Label>
			<Textarea
				id="{idPrefix}-note"
				rows={2}
				bind:value={values.note}
				placeholder="Lo que no cabe en un número"
			/>
		</div>
	</div>
</details>
