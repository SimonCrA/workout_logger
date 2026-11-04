<script lang="ts" generics="T extends string">
	/**
	 * Un interruptor de opciones excluyentes: radios reales bajo una pastilla blanca que se desliza
	 * a la elegida. `value` se puede enlazar; `onchange` recibe la opción elegida (por ejemplo, para
	 * guardarla y volver atrás si falla).
	 */
	let {
		legend,
		name,
		options,
		value = $bindable(),
		disabled = false,
		onchange
	}: {
		/** El nombre del grupo para lectores de pantalla ("Modo", "Vista del mapa"). */
		legend: string;
		/** El `name` de los radios: único en la página. */
		name: string;
		options: readonly { value: T; label: string }[];
		value: T;
		disabled?: boolean;
		onchange?: (value: T) => void;
	} = $props();

	const index = $derived(
		Math.max(
			0,
			options.findIndex((option) => option.value === value)
		)
	);

	function pick(next: T) {
		value = next;
		onchange?.(next);
	}
</script>

<fieldset {disabled}>
	<legend class="sr-only">{legend}</legend>
	<div
		class="relative grid rounded-full bg-muted p-1"
		style="grid-template-columns: repeat({options.length}, minmax(0, 1fr))"
	>
		<span
			aria-hidden="true"
			class="absolute inset-y-1 left-1 rounded-full bg-white shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none"
			style="width: calc((100% - 0.5rem) / {options.length}); transform: translateX({index * 100}%)"
		></span>
		{#each options as option (option.value)}
			<label
				class={[
					'relative flex min-h-9 items-center justify-center rounded-full px-2 text-sm transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring',
					option.value === value ? 'text-primary' : 'text-muted-foreground'
				]}
			>
				<!-- El radio cubre su opción entera, transparente: así se toca y se enfoca como un radio. -->
				<input
					type="radio"
					{name}
					value={option.value}
					checked={option.value === value}
					onchange={() => pick(option.value)}
					class="absolute inset-0 cursor-pointer appearance-none rounded-full opacity-0"
				/>
				{option.label}
			</label>
		{/each}
	</div>
</fieldset>
