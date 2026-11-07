<script lang="ts">
	import { setTypeLabel } from '#lib/log/labels.js';
	import type { SetFieldValues } from '#lib/log/rules.js';
	import type { SetType } from '#lib/log/types.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';

	/**
	 * Lo opcional de una serie: el tipo, el RIR y la nota. Lo comparten el registro, detrás de
	 * "RIR, tipo y nota", y la corrección, detrás de "Más opciones".
	 */
	let { idPrefix, values = $bindable() }: { idPrefix: string; values: SetFieldValues } = $props();
</script>

<div class="space-y-4">
	<div class="space-y-2">
		<Label>Tipo de serie</Label>
		<ToggleGroup.Root
			type="single"
			variant="outline"
			value={values.type}
			onValueChange={(value) => (values.type = (value as SetType) || 'normal')}
			class="flex-wrap justify-start"
		>
			{#each Object.entries(setTypeLabel) as [value, label] (value)}
				<ToggleGroup.Item {value} aria-label={label}>{label}</ToggleGroup.Item>
			{/each}
		</ToggleGroup.Root>
	</div>
	<div class="space-y-2">
		<Label>RIR (opcional)</Label>
		<ToggleGroup.Root type="single" variant="outline" bind:value={values.rir} class="justify-start">
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
