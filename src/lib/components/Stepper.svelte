<script lang="ts">
	import { nonNegative, stepValue } from '#lib/log/rules.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import Icon from './Icon.svelte';

	/** Un número con botones de paso, nunca negativo; el valor se puede escribir también. */
	let {
		id,
		label,
		step,
		value = $bindable(0)
	}: { id: string; label: string; step: number; value?: number } = $props();

	const wholeNumbers = $derived(Number.isInteger(step));

	function oninput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const typed = Number.parseFloat(input.value.replace(',', '.'));
		const parsed = Number.isNaN(typed) ? 0 : typed;
		value = nonNegative(wholeNumbers ? Math.round(parsed) : parsed);
		// Solo se corrige lo que no vale (negativos, infinito); lo demás se deja escribir en paz.
		if (parsed < 0 || !Number.isFinite(parsed)) input.value = String(value);
	}
</script>

<div class="flex items-center justify-between gap-3">
	<Label for={id} class="text-base">{label}</Label>
	<div class="flex items-center gap-1">
		<Button
			type="button"
			variant="outline"
			size="icon-lg"
			aria-label="Menos {label}"
			disabled={value <= 0}
			onclick={() => (value = stepValue(value, -step))}
		>
			<Icon name="minus" class="size-5" />
		</Button>
		<Input
			{id}
			type="number"
			inputmode="decimal"
			min="0"
			step="any"
			class="w-20 text-center text-lg"
			{value}
			{oninput}
		/>
		<Button
			type="button"
			variant="outline"
			size="icon-lg"
			aria-label="Más {label}"
			onclick={() => (value = stepValue(value, step))}
		>
			<Icon name="add" class="size-5" />
		</Button>
	</div>
</div>
