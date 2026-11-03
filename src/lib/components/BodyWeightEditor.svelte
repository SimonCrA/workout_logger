<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Sheet from '#lib/components/ui/sheet/index.js';
	import { bodyWeightProblem, type BodyWeightInput } from '#lib/log/profile-rules.js';
	import type { BodyWeight } from '#lib/log/types.js';
	import BodyWeightFields from './BodyWeightFields.svelte';

	/**
	 * Corregir un registro de peso corporal (spec #26): kilos o fecha. Trabaja sobre una copia;
	 * "Guardar" sin cambios solo cierra, y si guardar falla la hoja sigue abierta y lo dice.
	 */
	let {
		open = $bindable(false),
		entry,
		today,
		onsave
	}: {
		open?: boolean;
		entry: BodyWeight | null;
		today: string;
		onsave: (entry: BodyWeight, input: BodyWeightInput) => Promise<void>;
	} = $props();

	let kg = $state<number | null>(null);
	let date = $state('');
	let busy = $state(false);
	let error = $state<string | null>(null);

	// Cada apertura parte del registro tal como está.
	$effect(() => {
		if (open && entry) {
			kg = entry.kg;
			date = entry.date;
			error = null;
		}
	});

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!entry || busy) return;
		const input = { date, kg: kg ?? Number.NaN };
		if (input.date === entry.date && input.kg === entry.kg) {
			open = false;
			return;
		}
		error = bodyWeightProblem(input, today);
		if (error) return;
		busy = true;
		try {
			await onsave(entry, input);
			open = false;
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'No se pudo guardar el peso corporal';
		} finally {
			busy = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="bottom" class="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
		<Sheet.Header class="px-0">
			<Sheet.Title class="text-xl">Editar peso corporal</Sheet.Title>
		</Sheet.Header>
		<form {onsubmit} novalidate class="space-y-4">
			<BodyWeightFields idPrefix="edit-body-weight" bind:kg bind:date {today} invalid={!!error} />
			{#if error}
				<p role="alert" class="text-sm text-destructive">{error}</p>
			{/if}
			<Button type="submit" size="lg" class="w-full" disabled={busy || kg === null}>Guardar</Button>
		</form>
	</Sheet.Content>
</Sheet.Root>
