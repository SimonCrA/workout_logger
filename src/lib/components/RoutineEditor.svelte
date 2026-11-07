<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { flip } from 'svelte/animate';
	import { prefersReducedMotion } from 'svelte/motion';
	import {
		exerciseCountLabel,
		exerciseName,
		getExercise,
		getMuscle,
		prescriptionLabel
	} from '#lib/catalog/index.js';
	import ExercisePicker from '#lib/components/ExercisePicker.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import SegmentedSwitch from '#lib/components/SegmentedSwitch.svelte';
	import * as AlertDialog from '#lib/components/ui/alert-dialog/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Sheet from '#lib/components/ui/sheet/index.js';
	import { setCountLabel } from '#lib/log/labels.js';
	import {
		addExercise,
		draftOf,
		hasChanges,
		moveExercise,
		objectiveProblem,
		removeExercise,
		ROUTINE_LIMITS,
		routineMuscles,
		routineProblems,
		routineSetCount,
		stepRest,
		updateExercise,
		type RoutineDraft
	} from '#lib/log/routine-rules.js';

	/**
	 * El editor de una rutina personalizada (spec #14): trabaja sobre una copia de `initial` y solo
	 * "Guardar" (`onsave`) escribe. Al crear se guarda tal cual venga; al editar, solo con cambios,
	 * así una copia vieja nunca pisa lo que otro dispositivo guardó después. Salir con cambios sin
	 * guardar pregunta si se descartan; "Borrar rutina" (`ondelete`, al editar) pregunta también.
	 *
	 * Arriba, una barra fija con Cancelar, `title` y Guardar; el nombre se escribe en grande debajo
	 * (`note` lo acompaña, como "copia de Empuje"). La lista resume cada ejercicio y lo ordena; tocar
	 * uno abre su hoja con el objetivo.
	 */
	let {
		mode,
		title,
		note,
		initial,
		onsave,
		ondelete
	}: {
		mode: 'create' | 'edit';
		title: string;
		note?: string;
		initial: RoutineDraft;
		onsave: (draft: RoutineDraft) => Promise<void>;
		ondelete?: () => Promise<void>;
	} = $props();

	let draft = $state<RoutineDraft>(untrack(() => draftOf(initial)));
	let busy = $state(false);
	let error = $state<string | null>(null);
	let askDiscard = $state(false);
	let askDelete = $state(false);
	let pickerOpen = $state(false);
	let sheetOpen = $state(false);
	let editingId = $state<string | null>(null);
	// El que se acaba de mover se resalta un momento, para seguirlo con la vista.
	let movedId = $state<string | null>(null);
	let movedTimer: ReturnType<typeof setTimeout> | undefined;
	// Tras guardar o borrar, o al descartar, la salida ya no pregunta.
	let leaving = false;
	let pendingUrl: URL | null = null;

	const problems = $derived(routineProblems(draft));
	const dirty = $derived(hasChanges(draft, initial));
	const rows = $derived(
		draft.exercises.map((entry) => ({
			entry,
			name: exerciseName(entry.exerciseId),
			problem: objectiveProblem(entry)
		}))
	);
	const summary = $derived(
		[
			exerciseCountLabel(draft.exercises.length),
			setCountLabel(routineSetCount(draft.exercises)),
			routineMuscles(draft.exercises).join(', ')
		]
			.filter((part) => part !== '')
			.join(' · ')
	);
	// Lo que impide guardar y no se ve ya en su fila (el nombre), bajo la barra.
	const blocking = $derived(
		problems.find((problem) => !rows.some((row) => row.problem === problem))
	);
	const canSave = $derived(problems.length === 0 && !busy && (mode === 'create' || dirty));

	// El ejercicio de la hoja abierta; si se quita, la hoja se cierra.
	const editingIndex = $derived(rows.findIndex((row) => row.entry.exerciseId === editingId));
	const editing = $derived(editingIndex < 0 ? null : rows[editingIndex]);
	const editingMuscle = $derived.by(() => {
		const code = editing && getExercise(editing.entry.exerciseId)?.primaryMuscle;
		return code ? getMuscle(code)?.name : undefined;
	});

	const rirOptions = [
		{ value: '', label: 'Sin' },
		...['0', '1', '2', '3', '4'].map((value) => ({ value, label: value }))
	];

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

	/** Corre una acción que acaba saliendo del editor; si falla, el editor sigue, lo dice y vuelve a preguntar. */
	async function leaveWith(action: () => Promise<void>) {
		busy = true;
		leaving = true;
		error = null;
		try {
			await action();
		} catch (failure) {
			leaving = false;
			error = failure instanceof Error ? failure.message : 'No se pudo guardar la rutina';
		} finally {
			busy = false;
		}
	}

	function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!canSave) return;
		void leaveWith(() => onsave($state.snapshot(draft)));
	}

	function remove() {
		askDelete = false;
		if (ondelete) void leaveWith(ondelete);
	}

	function move(exerciseId: string, delta: -1 | 1) {
		draft = moveExercise(draft, exerciseId, delta);
		movedId = exerciseId;
		clearTimeout(movedTimer);
		movedTimer = setTimeout(() => (movedId = null), 900);
	}

	function open(exerciseId: string) {
		editingId = exerciseId;
		sheetOpen = true;
	}

	function quit(exerciseId: string) {
		sheetOpen = false;
		draft = removeExercise(draft, exerciseId);
	}

	type NumberField = 'sets' | 'repsMin' | 'repsMax' | 'rest';

	/** Lo escrito en un número: vacío o inválido es 0 en los obligatorios (se ve vacío y no deja guardar) y nada en el descanso. */
	function onNumber(exerciseId: string, field: NumberField, event: Event) {
		const typed = Number((event.currentTarget as HTMLInputElement).value.trim() || NaN);
		const value = Number.isFinite(typed) ? typed : field === 'rest' ? null : 0;
		draft = updateExercise(draft, exerciseId, { [field]: value });
	}
</script>

<form {onsubmit}>
	<!-- La barra fija ocupa el ancho del <main> desde arriba del todo: el margen negativo deshace su relleno. -->
	<header
		class="sticky top-0 z-10 -mx-6 -mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b bg-background px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3"
	>
		<a
			href="/rutinas"
			class="-ml-2 inline-flex min-h-11 items-center justify-self-start px-2 text-sm text-muted-foreground"
		>
			Cancelar
		</a>
		<h1 class="text-base whitespace-nowrap text-primary">{title}</h1>
		<Button type="submit" size="lg" class="justify-self-end px-3.5" disabled={!canSave}>
			Guardar
		</Button>
	</header>

	{#if (blocking && dirty) || error}
		<div class="mt-3 space-y-1">
			{#if blocking && dirty}
				<p role="status" class="text-sm text-muted-foreground">{blocking}</p>
			{/if}
			{#if error}
				<p role="alert" class="text-sm text-destructive">{error}</p>
			{/if}
		</div>
	{/if}

	<div class="mt-5 space-y-1.5">
		<label for="routine-name" class="block text-xs text-muted-foreground">
			Nombre{note ? ` · ${note}` : ''}
		</label>
		<div
			class="flex items-center gap-2 border-b-2 border-primary pb-1.5 has-aria-invalid:border-destructive"
		>
			<input
				id="routine-name"
				placeholder="Empuje A"
				autocomplete="off"
				maxlength={ROUTINE_LIMITS.name}
				aria-invalid={draft.name.trim() === '' ? true : undefined}
				bind:value={draft.name}
				class="min-w-0 flex-1 bg-transparent text-3xl text-primary outline-none placeholder:text-muted-foreground/50"
			/>
			<Icon name="pencil" class="size-5 shrink-0 text-muted-foreground" />
		</div>
		<p class="pt-1 text-sm text-muted-foreground">{summary}</p>
	</div>

	<section aria-labelledby="routine-exercises" class="mt-6">
		<h2 id="routine-exercises" class="sr-only">Ejercicios</h2>
		{#if rows.length === 0}
			<p class="text-muted-foreground">Todavía no hay ejercicios: añádelos con el buscador.</p>
		{:else}
			<ol
				class="divide-y overflow-hidden rounded-2xl border bg-white"
				aria-label="Ejercicios de la rutina"
			>
				{#each rows as { entry, name, problem }, index (entry.exerciseId)}
					<!-- Al ordenar, cada fila se desliza a su puesto nuevo (sin movimiento si el sistema lo pide). -->
					<li
						animate:flip={{ duration: prefersReducedMotion.current ? 0 : 260 }}
						class={[
							'relative flex items-center gap-1 py-1 pr-1.5 pl-3.5 transition-colors duration-700',
							entry.exerciseId === movedId ? 'moved' : 'bg-white'
						]}
					>
						<span class="w-5 shrink-0 text-sm text-muted-foreground">{index + 1}</span>
						<button
							type="button"
							class="min-w-0 flex-1 py-2.5 text-left active:opacity-70"
							onclick={() => open(entry.exerciseId)}
						>
							<span class="block text-primary">{name}</span>
							<span
								class={['block text-xs', problem ? 'text-destructive' : 'text-muted-foreground']}
							>
								{problem ? 'Revisa el objetivo' : prescriptionLabel(entry)}
							</span>
						</button>
						<Button
							type="button"
							variant="ghost"
							size="icon-lg"
							aria-label="Subir {name}"
							disabled={index === 0}
							onclick={() => move(entry.exerciseId, -1)}
						>
							<Icon name="arrow-up" class="size-5" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon-lg"
							aria-label="Bajar {name}"
							disabled={index === rows.length - 1}
							onclick={() => move(entry.exerciseId, 1)}
						>
							<Icon name="arrow-down" class="size-5" />
						</Button>
					</li>
				{/each}
			</ol>
		{/if}
		<button
			type="button"
			class="mt-3 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-base-content/25 text-primary active:bg-muted"
			onclick={() => (pickerOpen = true)}
		>
			<Icon name="add" class="size-5" />
			Añadir ejercicio
		</button>
	</section>

	{#if ondelete}
		<Button
			type="button"
			variant="destructive"
			class="mt-8 w-full"
			disabled={busy}
			onclick={() => (askDelete = true)}
		>
			Borrar rutina
		</Button>
	{/if}
</form>

<Sheet.Root bind:open={sheetOpen}>
	<Sheet.Content
		side="bottom"
		class="max-h-[90dvh] gap-5 overflow-y-auto rounded-t-3xl px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
	>
		{#if editing}
			{@const { entry, name, problem } = editing}
			<Sheet.Header class="px-0 pb-0">
				<Sheet.Description>
					Ejercicio {editingIndex + 1} de {rows.length}{editingMuscle ? ` · ${editingMuscle}` : ''}
				</Sheet.Description>
				<Sheet.Title class="text-xl text-primary">{name}</Sheet.Title>
			</Sheet.Header>

			<div class="grid grid-cols-2 gap-3">
				<div class="space-y-1.5">
					<span class="block text-xs text-muted-foreground">Series</span>
					<div class="flex h-12 items-center justify-between rounded-xl bg-muted px-1">
						<button
							type="button"
							class="flex size-10 items-center justify-center rounded-lg bg-white text-primary disabled:opacity-40"
							aria-label="Menos series de {name}"
							disabled={entry.sets <= 1}
							onclick={() =>
								(draft = updateExercise(draft, entry.exerciseId, {
									sets: Math.max(1, entry.sets - 1)
								}))}
						>
							<Icon name="minus" class="size-5" />
						</button>
						<input
							type="number"
							inputmode="numeric"
							min="1"
							max={ROUTINE_LIMITS.sets}
							aria-label="Series de {name}"
							class="w-10 bg-transparent text-center text-xl text-primary outline-none"
							value={entry.sets || ''}
							oninput={(event) => onNumber(entry.exerciseId, 'sets', event)}
						/>
						<button
							type="button"
							class="flex size-10 items-center justify-center rounded-lg bg-white text-primary disabled:opacity-40"
							aria-label="Más series de {name}"
							disabled={entry.sets >= ROUTINE_LIMITS.sets}
							onclick={() =>
								(draft = updateExercise(draft, entry.exerciseId, {
									sets: Math.min(ROUTINE_LIMITS.sets, entry.sets + 1)
								}))}
						>
							<Icon name="add" class="size-5" />
						</button>
					</div>
				</div>
				<div class="space-y-1.5">
					<span class="block text-xs text-muted-foreground">Reps</span>
					<div class="flex h-12 items-center gap-1.5">
						<input
							type="number"
							inputmode="numeric"
							min="1"
							max={ROUTINE_LIMITS.reps}
							aria-label="Reps mínimas de {name}"
							class="h-12 w-0 flex-1 rounded-xl bg-muted text-center text-xl text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
							value={entry.repsMin || ''}
							oninput={(event) => onNumber(entry.exerciseId, 'repsMin', event)}
						/>
						<span class="text-muted-foreground">–</span>
						<input
							type="number"
							inputmode="numeric"
							min="1"
							max={ROUTINE_LIMITS.reps}
							aria-label="Reps máximas de {name}"
							class="h-12 w-0 flex-1 rounded-xl bg-muted text-center text-xl text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
							value={entry.repsMax || ''}
							oninput={(event) => onNumber(entry.exerciseId, 'repsMax', event)}
						/>
					</div>
				</div>
			</div>

			<div class="flex items-center justify-between gap-3 rounded-xl border bg-white px-3.5 py-3">
				<span class="text-sm text-primary">Descanso</span>
				<div class="flex items-center gap-2">
					<button
						type="button"
						class="h-10 min-w-13 rounded-full bg-muted text-sm text-primary"
						aria-label="15 segundos menos de descanso"
						onclick={() =>
							(draft = updateExercise(draft, entry.exerciseId, { rest: stepRest(entry.rest, -1) }))}
					>
						−15
					</button>
					<span class="flex items-baseline gap-0.5">
						<input
							type="number"
							inputmode="numeric"
							min="1"
							max={ROUTINE_LIMITS.rest}
							placeholder="—"
							aria-label="Descanso de {name} (s)"
							class="w-14 bg-transparent text-right text-xl text-primary outline-none"
							value={entry.rest ?? ''}
							oninput={(event) => onNumber(entry.exerciseId, 'rest', event)}
						/>
						<span class="text-sm text-muted-foreground">s</span>
					</span>
					<button
						type="button"
						class="h-10 min-w-13 rounded-full bg-muted text-sm text-primary"
						aria-label="15 segundos más de descanso"
						onclick={() =>
							(draft = updateExercise(draft, entry.exerciseId, { rest: stepRest(entry.rest, 1) }))}
					>
						+15
					</button>
				</div>
			</div>

			<div class="space-y-2 rounded-xl border bg-white px-3.5 py-3">
				<span class="block text-sm text-primary">RIR objetivo</span>
				<SegmentedSwitch
					legend="RIR objetivo de {name}"
					name="rir-{entry.exerciseId}"
					options={rirOptions}
					value={entry.rir === null ? '' : String(entry.rir)}
					onchange={(value) =>
						(draft = updateExercise(draft, entry.exerciseId, {
							rir: value === '' ? null : Number(value)
						}))}
				/>
			</div>

			{#if problem}
				<p class="text-sm text-destructive">{problem}</p>
			{/if}

			<div class="flex items-center justify-between gap-3">
				<Button
					type="button"
					variant="ghost"
					size="lg"
					class="-ml-2.5 text-error-content"
					onclick={() => quit(entry.exerciseId)}
				>
					Quitar ejercicio
				</Button>
				<Button type="button" size="lg" class="px-7" onclick={() => (sheetOpen = false)}>
					Listo
				</Button>
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>

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

<style>
	/* El que se acaba de mover: un velo lima que se apaga solo. */
	.moved {
		background: color-mix(in oklch, var(--primary-foreground) 28%, white);
		z-index: 1;
	}
</style>
