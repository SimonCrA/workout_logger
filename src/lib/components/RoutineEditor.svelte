<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { getExercise } from '#lib/catalog/index.js';
	import ExercisePicker from '#lib/components/ExercisePicker.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import * as AlertDialog from '#lib/components/ui/alert-dialog/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import {
		addExercise,
		hasChanges,
		moveExercise,
		objectiveProblem,
		removeExercise,
		routineProblems,
		updateExercise,
		type RoutineDraft
	} from '#lib/log/routine-rules.js';

	/**
	 * El editor de una rutina personalizada (spec #14): trabaja sobre una copia de `initial` y solo
	 * "Guardar" (`onsave`) escribe. Salir con cambios sin guardar pregunta si se descartan; "Borrar
	 * rutina" (`ondelete`, solo al editar una guardada) pregunta también.
	 */
	let {
		initial,
		onsave,
		ondelete
	}: {
		initial: RoutineDraft;
		onsave: (draft: RoutineDraft) => Promise<void>;
		ondelete?: () => Promise<void>;
	} = $props();

	const copy = (draft: RoutineDraft): RoutineDraft => ({
		...draft,
		exercises: draft.exercises.map((entry) => ({ ...entry }))
	});

	let draft = $state<RoutineDraft>(untrack(() => copy(initial)));
	let busy = $state(false);
	let askDiscard = $state(false);
	let askDelete = $state(false);
	let pickerOpen = $state(false);
	// Tras guardar o borrar, o al descartar, la salida ya no pregunta.
	let leaving = false;
	let pendingUrl: URL | null = null;

	const problems = $derived(routineProblems(draft));
	const dirty = $derived(hasChanges(draft, initial));
	const rows = $derived(
		draft.exercises.map((entry) => ({
			entry,
			// La integridad del catálogo garantiza que cada ejercicio existe; el id es el último recurso.
			name: getExercise(entry.exerciseId)?.name ?? entry.exerciseId,
			problem: objectiveProblem(entry)
		}))
	);
	// Lo que impide guardar y no se ve ya en su fila (el nombre), junto al botón.
	const summary = $derived(
		problems.find((problem) => !rows.some((row) => row.problem === problem))
	);

	beforeNavigate((navigation) => {
		if (leaving || !dirty) return;
		navigation.cancel();
		// Cerrar la pestaña lo pregunta el navegador; dentro de la app lo pregunta el diálogo.
		if (navigation.type === 'leave') return;
		pendingUrl = navigation.to?.url ?? null;
		askDiscard = true;
	});

	function discard() {
		askDiscard = false;
		leaving = true;
		if (pendingUrl) void goto(pendingUrl);
	}

	/** Corre una acción que acaba saliendo del editor; si falla, el editor sigue y vuelve a preguntar. */
	async function leaveWith(action: () => Promise<void>) {
		busy = true;
		leaving = true;
		try {
			await action();
		} catch (error) {
			leaving = false;
			console.error('No se pudo guardar la rutina', error);
		} finally {
			busy = false;
		}
	}

	function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		if (problems.length > 0 || busy) return;
		void leaveWith(() => onsave($state.snapshot(draft)));
	}

	function remove() {
		askDelete = false;
		if (ondelete) void leaveWith(ondelete);
	}

	type NumberField = 'sets' | 'repsMin' | 'repsMax' | 'rest';

	/** Lo escrito en un número: vacío o inválido es 0 en los obligatorios (no deja guardar) y nada en el descanso. */
	function onNumber(exerciseId: string, field: NumberField, event: Event) {
		const typed = Number((event.currentTarget as HTMLInputElement).value.trim() || NaN);
		const value = Number.isFinite(typed) ? typed : field === 'rest' ? null : 0;
		draft = updateExercise(draft, exerciseId, { [field]: value });
	}

	function onRir(exerciseId: string, value: string) {
		draft = updateExercise(draft, exerciseId, { rir: value === '' ? null : Number(value) });
	}
</script>

<form {onsubmit} class="mt-4 space-y-6">
	<div class="space-y-2">
		<Label for="routine-name">Nombre</Label>
		<Input
			id="routine-name"
			placeholder="Empuje A"
			autocomplete="off"
			aria-invalid={draft.name.trim() === '' ? true : undefined}
			bind:value={draft.name}
		/>
	</div>

	<section aria-labelledby="routine-exercises">
		<h2 id="routine-exercises" class="text-lg">Ejercicios</h2>
		{#if rows.length === 0}
			<p class="mt-2 text-muted-foreground">Todavía no hay ejercicios: añádelos con el buscador.</p>
		{:else}
			<ol class="mt-2 divide-y" aria-label="Ejercicios de la rutina">
				{#each rows as { entry, name, problem }, index (entry.exerciseId)}
					<li class="space-y-3 py-4">
						<div class="flex items-center gap-1">
							<span class="w-5 text-sm text-muted-foreground">{index + 1}</span>
							<span class="flex-1">{name}</span>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								aria-label="Subir {name}"
								disabled={index === 0}
								onclick={() => (draft = moveExercise(draft, entry.exerciseId, -1))}
							>
								<Icon name="arrow-up" class="size-5" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								aria-label="Bajar {name}"
								disabled={index === rows.length - 1}
								onclick={() => (draft = moveExercise(draft, entry.exerciseId, 1))}
							>
								<Icon name="arrow-down" class="size-5" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								aria-label="Quitar {name}"
								onclick={() => (draft = removeExercise(draft, entry.exerciseId))}
							>
								<Icon name="cancel" class="size-5" />
							</Button>
						</div>
						<div class="flex flex-wrap items-center gap-x-5 gap-y-3 pl-6">
							<label class="flex items-center gap-2 text-sm">
								Series
								<Input
									type="number"
									inputmode="numeric"
									min="1"
									class="w-16 text-center"
									aria-label="Series de {name}"
									value={entry.sets}
									oninput={(event) => onNumber(entry.exerciseId, 'sets', event)}
								/>
							</label>
							<span class="flex items-center gap-2 text-sm">
								Reps
								<Input
									type="number"
									inputmode="numeric"
									min="1"
									class="w-16 text-center"
									aria-label="Reps mínimas de {name}"
									value={entry.repsMin}
									oninput={(event) => onNumber(entry.exerciseId, 'repsMin', event)}
								/>
								–
								<Input
									type="number"
									inputmode="numeric"
									min="1"
									class="w-16 text-center"
									aria-label="Reps máximas de {name}"
									value={entry.repsMax}
									oninput={(event) => onNumber(entry.exerciseId, 'repsMax', event)}
								/>
							</span>
						</div>
						<div class="flex flex-wrap items-center gap-x-5 gap-y-3 pl-6">
							<span class="flex items-center gap-2 text-sm">
								RIR
								<ToggleGroup.Root
									type="single"
									variant="outline"
									size="sm"
									aria-label="RIR objetivo de {name}"
									value={entry.rir === null ? '' : String(entry.rir)}
									onValueChange={(value) => onRir(entry.exerciseId, value)}
								>
									{#each ['0', '1', '2', '3', '4'] as value (value)}
										<ToggleGroup.Item {value} aria-label="RIR {value}">{value}</ToggleGroup.Item>
									{/each}
								</ToggleGroup.Root>
							</span>
							<label class="flex items-center gap-2 text-sm">
								Descanso
								<Input
									type="number"
									inputmode="numeric"
									min="1"
									class="w-20 text-center"
									aria-label="Descanso de {name} (s)"
									value={entry.rest ?? ''}
									oninput={(event) => onNumber(entry.exerciseId, 'rest', event)}
								/>
								s
							</label>
						</div>
						{#if problem}
							<p class="pl-6 text-sm text-destructive">{problem}</p>
						{/if}
					</li>
				{/each}
			</ol>
		{/if}
		<Button type="button" variant="outline" class="mt-4 w-full" onclick={() => (pickerOpen = true)}>
			<Icon name="add" class="size-5" />
			Añadir ejercicio
		</Button>
	</section>

	<div class="space-y-3">
		{#if summary && dirty}
			<p role="status" class="text-sm text-muted-foreground">{summary}</p>
		{/if}
		<Button type="submit" size="lg" class="w-full" disabled={problems.length > 0 || busy}>
			Guardar
		</Button>
		{#if ondelete}
			<Button
				type="button"
				variant="destructive"
				class="w-full"
				disabled={busy}
				onclick={() => (askDelete = true)}
			>
				Borrar rutina
			</Button>
		{/if}
	</div>
</form>

<ExercisePicker
	bind:open={pickerOpen}
	included={draft.exercises.map((entry) => entry.exerciseId)}
	onpick={(exercise) => (draft = addExercise(draft, exercise.id))}
/>

<AlertDialog.Root bind:open={askDiscard}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>¿Descartar los cambios?</AlertDialog.Title>
			<AlertDialog.Description>
				La rutina no está guardada. Si sales ahora, lo que cambiaste se pierde.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Seguir editando</AlertDialog.Cancel>
			<AlertDialog.Action onclick={discard}>Descartar</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root bind:open={askDelete}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>¿Borrar la rutina?</AlertDialog.Title>
			<AlertDialog.Description>
				Desaparece de Mis rutinas en todos tus dispositivos. Los entrenamientos que hiciste con ella
				conservan su nombre.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Conservar</AlertDialog.Cancel>
			<AlertDialog.Action variant="destructive" onclick={remove}>Borrar</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
