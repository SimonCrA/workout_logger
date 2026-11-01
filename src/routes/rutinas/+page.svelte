<script lang="ts">
	import { goto } from '$app/navigation';
	import { exerciseCountLabel } from '#lib/catalog/index.js';
	import StartRoutineDialog from '#lib/components/StartRoutineDialog.svelte';
	import TabPage from '#lib/components/TabPage.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { minuteClock } from '#lib/log/clock.svelte.js';
	import { lastDoneLabel } from '#lib/log/labels.js';
	import { live } from '#lib/log/live.svelte.js';
	import { liveRoutineList } from '#lib/log/routines.js';
	import { openWorkout } from '#lib/log/rules.js';
	import type { Routine, WorkoutMode } from '#lib/log/types.js';
	import { lastMode, startWorkout } from '#lib/log/workouts.js';
	import { requestSync } from '#lib/sync/runtime.svelte.js';

	// Mis rutinas, vivas desde IndexedDB, por última vez hecha. Las rutinas base viven bajo "Crear rutina": solo se copian.
	const list = live(() => liveRoutineList());
	const clock = minuteClock();
	// En curso: la rutina del entrenamiento en curso, si nació de una.
	const inProgress = $derived(openWorkout(list.value?.unfinished, clock.now)?.routineId);

	let starting = $state<{ routine: Routine; lastMode: WorkoutMode } | null>(null);
	let asking = $state(false);

	async function ask(routine: Routine) {
		starting = { routine, lastMode: await lastMode() };
		asking = true;
	}

	async function start(mode: WorkoutMode) {
		if (!starting) return;
		const { routine } = starting;
		await startWorkout({ routineId: routine.id, title: routine.name, mode });
		requestSync();
		await goto('/');
	}
</script>

<TabPage title="Rutinas">
	<section class="mt-4" aria-labelledby="mis-rutinas">
		<h2 id="mis-rutinas" class="text-lg">Mis rutinas</h2>
		{#if list.value === undefined}
			<p class="mt-2 text-muted-foreground">Cargando…</p>
		{:else if list.value.routines.length === 0}
			<p class="mt-2 text-muted-foreground">
				Todavía no tienes rutinas. Crea una desde una rutina base o desde cero.
			</p>
		{:else}
			<ul class="mt-2 divide-y" aria-label="Mis rutinas">
				{#each list.value.routines as { routine, lastDoneAt } (routine.id)}
					<li class="flex items-center gap-3 py-3">
						<a href="/rutinas/{routine.id}" class="min-w-0 flex-1 active:bg-muted">
							<span class="block truncate">{routine.name}</span>
							<span class="block text-sm text-muted-foreground">
								{exerciseCountLabel(routine.exercises.length)} · {lastDoneLabel(
									lastDoneAt,
									clock.now
								)}
							</span>
						</a>
						{#if routine.id === inProgress}
							<Button href="/" variant="secondary" size="sm">En curso</Button>
						{:else}
							<Button size="sm" onclick={() => ask(routine)}>Empezar</Button>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="mt-8" aria-labelledby="crear-rutina">
		<h2 id="crear-rutina" class="text-lg">Crear rutina</h2>
		<div class="mt-3 flex flex-wrap gap-2">
			<Button href="/rutinas/base">Desde una rutina base</Button>
			<Button href="/rutinas/nueva" variant="outline">Desde cero</Button>
		</div>
	</section>
</TabPage>

{#if starting}
	<StartRoutineDialog
		bind:open={asking}
		routineName={starting.routine.name}
		lastMode={starting.lastMode}
		onstart={start}
	/>
{/if}
