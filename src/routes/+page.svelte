<script lang="ts">
	import { exerciseName, getExercise, objectiveLabel } from '#lib/catalog/index.js';
	import Icon from '#lib/components/Icon.svelte';
	import RestCounter from '#lib/components/RestCounter.svelte';
	import TabPage from '#lib/components/TabPage.svelte';
	import TodayDashboard from '#lib/components/TodayDashboard.svelte';
	import WorkoutHeader from '#lib/components/WorkoutHeader.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { minuteClock } from '#lib/log/clock.svelte.js';
	import { restStart } from '#lib/log/companion.js';
	import { lastTimeLine, setCountLabel, weekdayLabel } from '#lib/log/labels.js';
	import { live } from '#lib/log/live.svelte.js';
	import { prescriptionFor } from '#lib/log/routine-rules.js';
	import { openWorkout } from '#lib/log/rules.js';
	import { addedExercises, nextInRoutine, routineProgress } from '#lib/log/today.js';
	import { changeWorkoutMode, finishWorkout, liveTodayLog } from '#lib/log/workouts.js';
	import { requestSync } from '#lib/sync/runtime.svelte.js';

	// El entrenamiento sin terminar, su rutina y sus series, vivos desde IndexedDB; si está en curso lo decide la regla con la hora actual.
	const log = live(() => liveTodayLog());
	const clock = minuteClock();
	const current = $derived(openWorkout(log.value?.unfinished, clock.now));
	const loaded = $derived(log.value !== undefined);
	const routine = $derived((current && log.value?.routine) || null);
	const prescribed = $derived(routine?.exercises ?? []);
	const sets = $derived(current ? (log.value?.sets ?? []) : []);
	const lastTimes = $derived(log.value?.lastTimes ?? {});
	const progress = $derived(routineProgress(prescribed, sets));
	const next = $derived(nextInRoutine(progress));
	// Con rutina, lo registrado fuera de ella; en un libre, todo lo registrado.
	const added = $derived(addedExercises(prescribed, sets));
	// El descanso corre desde la última serie, de cualquier ejercicio, frente al sugerido para ese ejercicio.
	const restFrom = $derived(restStart(log.value?.unfinished, clock.now));
	const lastSet = $derived(sets.at(-1));
	const suggested = $derived(
		lastSet ? (prescriptionFor(prescribed, lastSet.exerciseId)?.rest ?? null) : null
	);
	let finishing = $state(false);

	async function finish() {
		finishing = true;
		try {
			await finishWorkout();
			requestSync();
		} finally {
			finishing = false;
		}
	}
</script>

<TabPage title="Hoy" overline={weekdayLabel(clock.now)}>
	{#snippet actions()}
		{#if loaded && !current}
			<!-- El nombre accesible contiene el texto visible, "Libre". -->
			<Button href="/ejercicios" size="lg" class="px-3.5" aria-label="Entrenamiento libre">
				<Icon name="add" class="size-5" />
				Libre
			</Button>
		{/if}
	{/snippet}
	{#if !loaded}
		<p class="mt-4 text-muted-foreground">Cargando…</p>
	{:else}
		<!-- El dashboard siempre; con un entrenamiento en curso, este ocupa el lugar de "Toca". -->
		<TodayDashboard
			now={clock.now}
			currentId={current?.id ?? null}
			inProgress={current ? inProgress : undefined}
		/>
	{/if}
</TabPage>

{#snippet inProgress()}
	{#if current}
		<section
			aria-label="Entrenamiento en curso"
			class="mt-6 overflow-hidden rounded-2xl border bg-white"
		>
			<WorkoutHeader
				workout={current}
				now={clock.now}
				onmode={async (mode) => {
					await changeWorkoutMode(mode);
					requestSync();
				}}
			>
				{#snippet rest()}
					{#if restFrom !== null}
						<RestCounter lastSetAt={restFrom} {suggested} variant="panel" />
					{/if}
				{/snippet}
			</WorkoutHeader>

			<div class="space-y-6 p-4">
				{#if routine}
					<ol class="-mx-2" aria-label="Ejercicios de la rutina">
						{#each progress as { entry, done, met }, index (entry.exerciseId)}
							{@const last = lastTimes[entry.exerciseId] ?? []}
							{@const isNext = index === next}
							<li>
								<!-- El que toca va resaltado; su siguiente serie es el punto lima. -->
								<a
									href="/ejercicios/{entry.exerciseId}"
									aria-current={isNext ? 'step' : undefined}
									class={[
										'flex items-center justify-between gap-3 rounded-lg px-2 py-3 active:bg-base-300',
										isNext && 'bg-muted'
									]}
								>
									<span class="min-w-0">
										<span class={['block', met ? 'text-muted-foreground' : 'text-primary']}>
											{exerciseName(entry.exerciseId)}
										</span>
										{#if last.length > 0}
											<span class="block text-xs text-muted-foreground">
												{lastTimeLine(last, getExercise(entry.exerciseId)?.loadMode ?? 'external')}
											</span>
										{/if}
									</span>
									<span class="flex shrink-0 flex-col items-end gap-1.5">
										<span class="text-xs text-muted-foreground">{objectiveLabel(entry)}</span>
										<span class="flex items-center gap-2">
											<span class="flex gap-1" aria-hidden="true">
												{#each { length: Math.min(entry.sets, 10) }, dot (dot)}
													<span
														class={[
															'size-2.5 rounded-full',
															dot < done
																? 'bg-primary'
																: isNext && dot === done
																	? 'bg-primary-foreground ring-1 ring-primary'
																	: 'bg-base-300'
														]}
													></span>
												{/each}
											</span>
											<span class="text-sm tabular-nums">{done}/{entry.sets}</span>
											{#if met}
												<span role="img" aria-label="Objetivo cumplido">
													<Icon name="check" class="size-4 text-primary" />
												</span>
											{/if}
										</span>
									</span>
								</a>
							</li>
						{/each}
					</ol>
				{/if}

				{#if added.length > 0}
					{@const title = routine ? 'Añadidos' : 'Ejercicios'}
					<section>
						<h3 class="text-lg">{title}</h3>
						<ul class="divide-y" aria-label={title}>
							{#each added as { exerciseId, sets: done } (exerciseId)}
								<li>
									<a
										href="/ejercicios/{exerciseId}"
										class="flex items-center justify-between gap-3 py-3 active:bg-muted"
									>
										<span>{exerciseName(exerciseId)}</span>
										<span class="text-sm text-muted-foreground">{setCountLabel(done.length)}</span>
									</a>
								</li>
							{/each}
						</ul>
					</section>
				{/if}

				<div class="flex gap-2">
					<Button href="/ejercicios" size="lg" class="flex-1">
						<Icon name="add" class="size-5" />
						Añadir ejercicio
					</Button>
					<Button variant="outline" size="lg" class="px-4" disabled={finishing} onclick={finish}>
						Terminar
					</Button>
				</div>
			</div>
		</section>
	{/if}
{/snippet}
