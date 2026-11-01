<script lang="ts">
	import * as AlertDialog from '#lib/components/ui/alert-dialog/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { toDatetimeLocal } from '#lib/log/labels.js';
	import { newStartProblem } from '#lib/log/rules.js';

	/**
	 * "Cambiar fecha" (ADR-0006): a qué fecha y hora empezó en realidad el entrenamiento. Ni el
	 * inicio ni su fin (`endsAt`: el fin, o la última serie mientras no termina) pueden caer en el
	 * futuro. `onmove` recibe el inicio nuevo; quien abre el diálogo mueve el entrenamiento y sus
	 * series. Guardar sin cambiar nada solo cierra: el campo va al minuto y no debe mover los
	 * segundos. Si mover falla, el diálogo sigue abierto y lo dice.
	 */
	let {
		open = $bindable(false),
		startedAt,
		endsAt,
		onmove
	}: {
		open?: boolean;
		startedAt: string;
		endsAt: string;
		onmove: (startedAt: Date) => Promise<void>;
	} = $props();

	let value = $state('');
	let busy = $state(false);
	let error = $state<string | null>(null);

	const current = $derived(toDatetimeLocal(startedAt));
	// Cuánto dura: lo que, sumado al inicio nuevo, tampoco puede pasar de ahora.
	const span = $derived(new Date(endsAt).getTime() - new Date(startedAt).getTime());
	const max = $derived(
		open ? toDatetimeLocal(new Date(Date.now() - span).toISOString()) : undefined
	);

	// Cada apertura parte del inicio actual, en hora local.
	$effect(() => {
		if (open) {
			value = current;
			error = null;
		}
	});

	async function move() {
		if (value === current) {
			open = false;
			return;
		}
		// Lo escrito en el campo se lee como hora local; vacío es una fecha inválida.
		const chosen = new Date(value);
		const problem = newStartProblem(chosen, span, new Date());
		if (problem) {
			error = problem;
			return;
		}
		busy = true;
		error = null;
		try {
			await onmove(chosen);
			open = false;
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'No se pudo mover el entrenamiento';
		} finally {
			busy = false;
		}
	}
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>¿Cuándo empezó?</AlertDialog.Title>
			<AlertDialog.Description>
				Todas sus series se mueven con él, conservando el tiempo entre una y otra.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<div class="space-y-2">
			<Label for="workout-start">Inicio</Label>
			<Input
				id="workout-start"
				type="datetime-local"
				{max}
				disabled={busy}
				aria-invalid={error ? true : undefined}
				bind:value
			/>
			{#if error}
				<p role="alert" class="text-sm text-destructive">{error}</p>
			{/if}
		</div>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={busy}>Cancelar</AlertDialog.Cancel>
			<AlertDialog.Action disabled={busy} onclick={move}>Guardar</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
