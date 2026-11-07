<script lang="ts">
	import { goto } from '$app/navigation';
	import { baseRoutinesOf, routineGroups } from '#lib/catalog/index.js';
	import Icon from '#lib/components/Icon.svelte';
	import RoutineCard from '#lib/components/RoutineCard.svelte';
	import StartRoutineDialog from '#lib/components/StartRoutineDialog.svelte';
	import TabPage from '#lib/components/TabPage.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import { minuteClock } from '#lib/log/clock.svelte.js';
	import { formatTime, lastDoneLabel } from '#lib/log/labels.js';
	import { live } from '#lib/log/live.svelte.js';
	import { liveRoutineList } from '#lib/log/routines.js';
	import { openWorkout, routineStart } from '#lib/log/rules.js';
	import { routineProgress } from '#lib/log/today.js';
	import type { Routine, WorkoutMode } from '#lib/log/types.js';
	import { startWorkout } from '#lib/log/workouts.js';
	import { requestSync } from '#lib/sync/runtime.svelte.js';

	// Mis rutinas, vivas desde IndexedDB, por última vez hecha. Las rutinas base viven bajo "Crear rutina": solo se copian.
	const list = live(() => liveRoutineList());
	const clock = minuteClock();
	const current = $derived(openWorkout(list.value?.unfinished, clock.now));
	// La que está en curso va primera; el resto, en el orden de la lista.
	const routines = $derived(
		[...(list.value?.routines ?? [])].sort(
			(a, b) =>
				Number(b.routine.id === current?.routineId) - Number(a.routine.id === current?.routineId)
		)
	);
	const overline = $derived.by(() => {
		const count = list.value?.routines.length;
		if (count === undefined) return undefined;
		if (count === 0) return 'Ninguna todavía';
		return count === 1 ? '1 rutina' : `${count} rutinas`;
	});

	const createOptions = [
		{
			label: 'Desde una rutina base',
			hint: 'La copias y la ajustas',
			href: '/rutinas/base',
			icon: 'clipboard'
		},
		{ label: 'Desde cero', hint: 'Eliges cada ejercicio', href: '/rutinas/nueva', icon: 'add' }
	];

	function progressOf(routine: Routine) {
		if (!current || routine.id !== current.routineId) return null;
		const met = routineProgress(routine.exercises, list.value?.sets ?? []).filter(
			(item) => item.met
		).length;
		return { since: `desde las ${formatTime(current.startedAt)}`, met };
	}

	// La rutina por la que se preguntó el modo; la pregunta parte de la última elección, que viene con la lista.
	let starting = $state<{ routine: Routine; lastMode: WorkoutMode } | null>(null);
	let asking = $state(false);

	function ask(routine: Routine, lastMode: WorkoutMode) {
		starting = { routine, lastMode };
		asking = true;
	}

	async function start(mode: WorkoutMode) {
		if (!starting) return;
		await startWorkout(routineStart(starting.routine, mode));
		requestSync();
		await goto('/');
	}
</script>

<TabPage title="Rutinas" {overline} sticky>
	{#snippet actions()}
		<!-- Crear elige cómo nace la rutina personalizada; el nombre accesible contiene el texto visible. -->
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button {...props} size="lg" class="px-3.5" aria-label="Crear rutina personalizada">
						<Icon name="add" class="size-5" />
						Crear rutina
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="w-64">
				<DropdownMenu.Label class="text-xs tracking-wider text-muted-foreground uppercase">
					Rutina personalizada
				</DropdownMenu.Label>
				{#each createOptions as option (option.href)}
					<DropdownMenu.Item class="gap-3 px-3 py-2.5">
						{#snippet child({ props })}
							<a href={option.href} {...props}>
								<Icon name={option.icon} class="size-5 text-primary" />
								<span>
									<span class="block text-base">{option.label}</span>
									<span class="block text-xs text-muted-foreground">{option.hint}</span>
								</span>
							</a>
						{/snippet}
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{/snippet}

	{#if list.value === undefined}
		<p class="mt-4 text-muted-foreground">Cargando…</p>
	{:else if routines.length === 0}
		{@render empty()}
	{:else}
		<ul class="mt-4 flex flex-col gap-3" aria-label="Mis rutinas">
			{#each routines as { routine, lastDoneAt } (routine.id)}
				<RoutineCard
					{routine}
					lastDone={lastDoneLabel(lastDoneAt, clock.now)}
					inProgress={progressOf(routine)}
					quiet={current !== undefined}
					onstart={() => ask(routine, list.value!.lastMode)}
				/>
			{/each}
		</ul>
	{/if}
</TabPage>

{#snippet empty()}
	<section aria-labelledby="sin-rutinas" class="mt-6 flex flex-col items-center gap-5 text-center">
		<!-- Una tarjeta de rutina por llenar: lo que aparecerá aquí al crear la primera. -->
		<div class="relative h-36 w-60" aria-hidden="true">
			<div class="absolute top-4 left-5 h-28 w-50 -rotate-5 rounded-2xl bg-base-300/70"></div>
			<div
				class="absolute top-2 left-3 flex h-30 w-52 flex-col gap-2.5 rounded-2xl border-2 border-dashed border-base-content/25 bg-white p-4"
			>
				<span class="h-3 w-24 rounded-full bg-base-300"></span>
				<span class="h-2 w-14 rounded-full bg-base-200"></span>
				<span class="mt-1 flex gap-1.5">
					<span class="h-4 w-11 rounded-full bg-base-200"></span>
					<span class="h-4 w-9 rounded-full bg-base-200"></span>
					<span class="h-4 w-12 rounded-full bg-base-200"></span>
				</span>
				<span class="h-5 w-16 self-end rounded-md bg-base-300"></span>
			</div>
			<div
				class="absolute top-0 right-0 flex size-12 items-center justify-center rounded-full border-4 border-background bg-primary-foreground text-primary"
			>
				<Icon name="add" class="size-6" />
			</div>
		</div>
		<div class="flex max-w-xs flex-col gap-2">
			<h2 id="sin-rutinas" class="text-xl text-primary">Arma tu primera rutina</h2>
			<p class="text-sm text-muted-foreground">
				Guarda tus ejercicios con sus series y descansos, y empiézala con un toque desde aquí o
				desde Hoy.
			</p>
		</div>
		<div class="flex w-full flex-col gap-2">
			<Button href="/rutinas/base" size="lg" class="h-13 text-base">
				<Icon name="clipboard" class="size-5" />
				Desde una rutina base
			</Button>
			<Button
				href="/rutinas/nueva"
				variant="outline"
				size="lg"
				class="h-13 border-primary text-base text-primary"
			>
				<Icon name="add" class="size-5" />
				Desde cero
			</Button>
		</div>
	</section>

	<section aria-labelledby="para-empezar" class="mt-8">
		<div class="flex items-center justify-between gap-2">
			<h2 id="para-empezar" class="text-base text-primary">Rutinas base para empezar</h2>
			<Button href="/rutinas/base" variant="ghost" size="sm" class="-mr-2.5">Ver todas</Button>
		</div>
		<ul
			class="-mx-6 mt-2 flex snap-x gap-2 overflow-x-auto px-6 pb-1"
			aria-label="Grupos de rutinas base"
		>
			{#each routineGroups as group (group.id)}
				{@const count = baseRoutinesOf(group.id).length}
				<li class="shrink-0 snap-start">
					<a
						href="/rutinas/base#grupo-{group.id}"
						class="flex h-24 w-38 flex-col justify-between rounded-xl border bg-white p-3 active:bg-muted"
					>
						<span class="text-sm text-primary">{group.name}</span>
						<span class="text-xs text-muted-foreground">
							{count === 1 ? '1 rutina' : `${count} rutinas`}
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/snippet}

{#if starting}
	<StartRoutineDialog
		bind:open={asking}
		routineName={starting.routine.name}
		lastMode={starting.lastMode}
		onstart={start}
	/>
{/if}
