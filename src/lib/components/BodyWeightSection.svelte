<script lang="ts">
	import * as AlertDialog from '#lib/components/ui/alert-dialog/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { formatDay, formatKg } from '#lib/log/labels.js';
	import { bodyWeightProblem, type BodyWeightInput } from '#lib/log/profile-rules.js';
	import type { BodyWeight } from '#lib/log/types.js';
	import BodyWeightFields from './BodyWeightFields.svelte';
	import BodyWeightEditor from './BodyWeightEditor.svelte';

	/**
	 * "Peso corporal" en Perfil (spec #26): el último valor con su fecha, el formulario para
	 * registrar (hoy por defecto) y el historial con editar y borrar por fila. Recibe el historial
	 * ya ordenado y avisa con callbacks; quien la usa escribe. `today` es el día local de hoy.
	 */
	let {
		history,
		today,
		onlog,
		onedit,
		ondelete
	}: {
		history: BodyWeight[] | undefined;
		today: string;
		onlog: (input: BodyWeightInput) => Promise<void>;
		onedit: (entry: BodyWeight, input: BodyWeightInput) => Promise<void>;
		ondelete: (entry: BodyWeight) => Promise<void>;
	} = $props();

	let kg = $state<number | null>(null);
	let date = $state('');
	let busy = $state(false);
	let error = $state<string | null>(null);
	let editing = $state<BodyWeight | null>(null);
	let editorOpen = $state(false);
	let deleting = $state<BodyWeight | null>(null);
	let deleteOpen = $state(false);
	let deleteError = $state<string | null>(null);

	const latest = $derived(history?.[0]);

	// La fecha arranca en hoy, y vuelve a hoy si el día cambia con la página abierta sin haberla tocado.
	let lastToday = '';
	$effect(() => {
		if (date === '' || date === lastToday) date = today;
		lastToday = today;
	});

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;
		const input = { date, kg: kg ?? Number.NaN };
		error = bodyWeightProblem(input, today);
		if (error) return;
		busy = true;
		try {
			await onlog(input);
			kg = null;
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'No se pudo guardar el peso corporal';
		} finally {
			busy = false;
		}
	}

	function edit(entry: BodyWeight) {
		editing = entry;
		editorOpen = true;
	}

	function askDelete(entry: BodyWeight) {
		deleting = entry;
		deleteError = null;
		deleteOpen = true;
	}

	async function confirmDelete() {
		if (!deleting || busy) return;
		busy = true;
		try {
			await ondelete(deleting);
			deleteOpen = false;
		} catch (cause) {
			deleteError = cause instanceof Error ? cause.message : 'No se pudo borrar el registro';
		} finally {
			busy = false;
		}
	}
</script>

<section aria-labelledby="body-weight-title" class="mt-6">
	<h2 id="body-weight-title" class="text-lg">Peso corporal</h2>
	{#if latest}
		<p class="mt-2" aria-label="Último peso corporal">
			<span class="text-3xl font-semibold">{formatKg(latest.kg)}</span>
			<span class="text-muted-foreground"> · {formatDay(latest.date)}</span>
		</p>
	{:else if history}
		<p class="mt-2 text-muted-foreground">Aún no has registrado tu peso corporal.</p>
	{/if}

	<form {onsubmit} novalidate class="mt-4 grid grid-cols-2 gap-3">
		<BodyWeightFields idPrefix="body-weight" bind:kg bind:date {today} invalid={!!error} />
		{#if error}
			<p role="alert" class="col-span-2 text-sm text-destructive">{error}</p>
		{/if}
		<Button type="submit" class="col-span-2" disabled={busy || kg === null}>Registrar peso</Button>
	</form>

	{#if history && history.length > 0}
		<h3 class="mt-6 text-sm text-muted-foreground">Historial</h3>
		<ul aria-label="Historial de peso corporal" class="mt-2 divide-y">
			{#each history as entry (entry.id)}
				<li class="flex items-center gap-2 py-2">
					<span class="flex-1">
						{formatKg(entry.kg)}
						<span class="text-muted-foreground">· {formatDay(entry.date)}</span>
					</span>
					<Button
						variant="ghost"
						size="sm"
						aria-label="Editar el peso del {formatDay(entry.date)}"
						onclick={() => edit(entry)}
					>
						Editar
					</Button>
					<Button
						variant="ghost"
						size="sm"
						class="text-destructive"
						aria-label="Borrar el peso del {formatDay(entry.date)}"
						onclick={() => askDelete(entry)}
					>
						Borrar
					</Button>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<BodyWeightEditor bind:open={editorOpen} entry={editing} {today} onsave={onedit} />

<AlertDialog.Root bind:open={deleteOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>¿Borrar el registro?</AlertDialog.Title>
			<AlertDialog.Description>
				{deleting ? `${formatKg(deleting.kg)} del ${formatDay(deleting.date)}` : ''}
			</AlertDialog.Description>
		</AlertDialog.Header>
		{#if deleteError}
			<p role="alert" class="text-sm text-destructive">{deleteError}</p>
		{/if}
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={busy}>Conservar</AlertDialog.Cancel>
			<AlertDialog.Action disabled={busy} onclick={confirmDelete}>Borrar</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
