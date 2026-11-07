<script lang="ts">
	import type { LoadMode } from '#lib/catalog/index.js';
	import { weightLabel } from '#lib/log/labels.js';
	import type { SetFieldValues } from '#lib/log/rules.js';
	import SetOptions from './SetOptions.svelte';
	import Stepper from './Stepper.svelte';

	/**
	 * Los controles de una serie al corregirla (spec #18): reps y peso según el modo de carga del
	 * ejercicio, nunca negativos, y bajo "Más opciones" el tipo, el RIR y la nota (`SetOptions`, los
	 * mismos que al registrar). `idPrefix` distingue los campos cuando hay dos juegos en la misma página.
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
	<div class="mt-3">
		<SetOptions {idPrefix} bind:values />
	</div>
</details>
