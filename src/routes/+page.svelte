<script lang="ts">
	import TabPage from '#lib/components/TabPage.svelte';
	import WorkoutHeader from '#lib/components/WorkoutHeader.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { live } from '#lib/log/live.svelte.js';
	import { isWorkoutOpen } from '#lib/log/rules.js';
	import { changeWorkoutMode, finishWorkout, liveOpenWorkout } from '#lib/log/workouts.js';
	import { requestSync } from '#lib/sync/runtime.svelte.js';

	// El entrenamiento sin hora de fin, vivo desde IndexedDB; si está en curso lo decide la regla con la hora actual.
	const open = live(() => liveOpenWorkout());
	let now = $state(new Date());
	$effect(() => {
		// Un libre deja de estar en curso solo por el paso del tiempo: se vuelve a mirar cada minuto.
		const timer = setInterval(() => (now = new Date()), 60_000);
		return () => clearInterval(timer);
	});
	const current = $derived(
		open.value && isWorkoutOpen(open.value, now) ? open.value.workout : undefined
	);
	const loaded = $derived(open.value !== undefined);
</script>

<TabPage title="Hoy" empty={loaded && !current ? 'Aquí irá el entrenamiento de hoy.' : undefined}>
	{#if !loaded}
		<p class="mt-4 text-muted-foreground">Cargando…</p>
	{:else if current}
		<WorkoutHeader
			workout={current}
			{now}
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
