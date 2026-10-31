<script lang="ts">
	import TabPage from '#lib/components/TabPage.svelte';
	import WorkoutHeader from '#lib/components/WorkoutHeader.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { minuteClock } from '#lib/log/clock.svelte.js';
	import { live } from '#lib/log/live.svelte.js';
	import { openWorkout } from '#lib/log/rules.js';
	import { changeWorkoutMode, finishWorkout, liveUnfinishedWorkout } from '#lib/log/workouts.js';
	import { requestSync } from '#lib/sync/runtime.svelte.js';

	// El entrenamiento sin terminar, vivo desde IndexedDB; si está en curso lo decide la regla con la hora actual.
	const unfinished = live(() => liveUnfinishedWorkout());
	const clock = minuteClock();
	const current = $derived(openWorkout(unfinished.value, clock.now));
	const loaded = $derived(unfinished.value !== undefined);
</script>

<TabPage title="Hoy" empty={loaded && !current ? 'Aquí irá el entrenamiento de hoy.' : undefined}>
	{#if !loaded}
		<p class="mt-4 text-muted-foreground">Cargando…</p>
	{:else if current}
		<WorkoutHeader
			workout={current}
			now={clock.now}
			onmode={async (mode) => {
				await changeWorkoutMode(mode);
				requestSync();
			}}
			onfinish={async () => {
				await finishWorkout();
				requestSync();
			}}
		/>
	{/if}
	<Button href="/ejercicios" class="mt-6">Buscar un ejercicio</Button>
</TabPage>
