<script lang="ts">
	import { exerciseName, getExercise } from '#lib/catalog/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Sheet from '#lib/components/ui/sheet/index.js';
	import { formatDate, formatTime } from '#lib/log/labels.js';
	import {
		setChanges,
		setFieldValues,
		type SetChanges,
		type SetFieldValues
	} from '#lib/log/rules.js';
	import type { WorkoutSet } from '#lib/log/types.js';
	import SetFields from './SetFields.svelte';

	/**
	 * Corregir una serie desde su fila (spec #18), de hoy o de un día anterior, con los mismos
	 * controles que al registrar y según el modo de carga de su ejercicio. Trabaja sobre una copia
	 * de la serie: "Guardar" entrega los valores (`onsave`) y "Borrar serie" pide borrarla
	 * (`ondelete`); quien abre la hoja escribe. Si algo falla, la hoja sigue abierta y lo dice.
	 */
	let {
		open = $bindable(false),
		set,
		onsave,
		ondelete
	}: {
		open?: boolean;
		set: WorkoutSet | null;
		onsave: (set: WorkoutSet, changes: SetChanges) => Promise<void>;
		ondelete: (set: WorkoutSet) => Promise<void>;
	} = $props();

	let values = $state<SetFieldValues>(
		setFieldValues({ reps: 0, weight: 0, rir: null, type: 'normal', note: null })
	);
	let busy = $state(false);
	let error = $state<string | null>(null);

	const loadMode = $derived((set && getExercise(set.exerciseId)?.loadMode) ?? 'external');
	const subtitle = $derived(
		set
			? `${exerciseName(set.exerciseId)} · ${formatDate(set.performedAt)} · ${formatTime(set.performedAt)}`
			: ''
	);

	// Cada apertura parte de la serie tal como está.
	$effect(() => {
		if (open && set) {
			values = setFieldValues(set);
			error = null;
		}
	});

	/** Corre una corrección y cierra; si falla, la hoja sigue abierta y lo dice. */
	async function correct(action: (set: WorkoutSet) => Promise<void>, failure: string) {
		if (!set || busy) return;
		busy = true;
		error = null;
		try {
			await action(set);
			open = false;
		} catch (cause) {
			error = cause instanceof Error ? cause.message : failure;
		} finally {
			busy = false;
		}
	}

	function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		if (values.reps < 1) return;
		const changes = setChanges(values);
		void correct((current) => onsave(current, changes), 'No se pudo guardar la serie');
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content
		side="bottom"
		class="max-h-[90dvh] overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
	>
		<Sheet.Header class="px-0">
			<Sheet.Title class="text-xl">Editar serie</Sheet.Title>
			<Sheet.Description>{subtitle}</Sheet.Description>
		</Sheet.Header>
		{#if set}
			<form {onsubmit} class="space-y-4">
				<SetFields idPrefix="edit" {loadMode} bind:values expanded />
				{#if error}
					<p role="alert" class="text-sm text-destructive">{error}</p>
				{/if}
				<Button type="submit" size="lg" class="w-full" disabled={values.reps < 1 || busy}>
					Guardar
				</Button>
				<Button
					type="button"
					variant="destructive"
					class="w-full"
					disabled={busy}
					onclick={() => void correct(ondelete, 'No se pudo borrar la serie')}
				>
					Borrar serie
				</Button>
			</form>
		{/if}
	</Sheet.Content>
</Sheet.Root>
