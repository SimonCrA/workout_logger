<script lang="ts">
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { PROFILE_LIMITS } from '#lib/log/profile-rules.js';

	/**
	 * Los campos de un peso corporal, los mismos al registrar y al corregir: kilos y fecha, sin
	 * fechas futuras. `idPrefix` distingue los campos cuando hay dos juegos en la misma página.
	 */
	let {
		idPrefix,
		kg = $bindable(),
		date = $bindable(),
		today,
		invalid = false
	}: {
		idPrefix: string;
		kg: number | null;
		date: string;
		today: string;
		invalid?: boolean;
	} = $props();
</script>

<div class="space-y-2">
	<Label for="{idPrefix}-kg">Peso corporal (kg)</Label>
	<Input
		id="{idPrefix}-kg"
		type="number"
		inputmode="decimal"
		step="0.1"
		min={PROFILE_LIMITS.minKg}
		max={PROFILE_LIMITS.maxKg}
		aria-invalid={invalid ? true : undefined}
		bind:value={kg}
	/>
</div>
<div class="space-y-2">
	<Label for="{idPrefix}-date">Fecha</Label>
	<Input id="{idPrefix}-date" type="date" max={today} bind:value={date} />
</div>
