<script lang="ts">
	import { nonNegative, stepValue } from '#lib/log/rules.js';

	/**
	 * El número grande del registro, con su unidad y un botón de paso a cada lado; también se
	 * escribe. Nunca baja de `min`. `stepText` es lo que se lee en los botones ("2,5" en el peso);
	 * sin él, solo el signo.
	 */
	let {
		id,
		label,
		unit,
		step,
		stepText,
		min = 0,
		value = $bindable(0)
	}: {
		id: string;
		/** El nombre del campo para lectores de pantalla ("Reps", "Peso (kg)"). */
		label: string;
		unit: string;
		step: number;
		stepText?: string;
		min?: number;
		value?: number;
	} = $props();

	const wholeNumbers = $derived(Number.isInteger(step));

	function oninput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const typed = Number.parseFloat(input.value.replace(',', '.'));
		const parsed = Number.isNaN(typed) ? 0 : typed;
		value = Math.max(min, nonNegative(wholeNumbers ? Math.round(parsed) : parsed));
		if (parsed < 0 || !Number.isFinite(parsed)) input.value = String(value);
	}

	/** Al salir del campo se ve lo que vale: lo que se borró o quedó por debajo del mínimo. */
	function onchange(event: Event) {
		(event.currentTarget as HTMLInputElement).value = String(value);
	}
</script>

<div class="flex items-center justify-between gap-2">
	<button
		type="button"
		class="flex size-13 shrink-0 items-center justify-center rounded-full bg-muted text-primary active:bg-base-300 disabled:opacity-40"
		aria-label="Menos {label}"
		disabled={value <= min}
		onclick={() => (value = Math.max(min, stepValue(value, -step)))}
	>
		<span class={stepText ? 'text-sm' : 'text-2xl'}>−{stepText ?? ''}</span>
	</button>
	<label for={id} class="flex min-w-0 items-baseline justify-center gap-1.5">
		<input
			{id}
			type="number"
			inputmode="decimal"
			{min}
			step="any"
			aria-label={label}
			class="w-28 bg-transparent text-right text-5xl leading-none text-primary tabular-nums outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-ring"
			{value}
			{oninput}
			{onchange}
		/>
		<span class="w-12 text-base text-muted-foreground">{unit}</span>
	</label>
	<button
		type="button"
		class="flex size-13 shrink-0 items-center justify-center rounded-full bg-muted text-primary active:bg-base-300"
		aria-label="Más {label}"
		onclick={() => (value = stepValue(value, step))}
	>
		<span class={stepText ? 'text-sm' : 'text-2xl'}>+{stepText ?? ''}</span>
	</button>
</div>
