<script lang="ts">
	import TabPage from '#lib/components/TabPage.svelte';
	import { minuteClock } from '#lib/log/clock.svelte.js';
	import { groupByMonth, historyRow } from '#lib/log/history.js';
	import {
		formatElapsed,
		monthLabel,
		relativeDayLabel,
		workoutSummaryLabel,
		workoutTitle
	} from '#lib/log/labels.js';
	import { live } from '#lib/log/live.svelte.js';
	import { liveWorkoutHistory } from '#lib/log/workouts.js';

	// Los entrenamientos con series, vivos desde IndexedDB; "Hoy" y "Ayer" se recalculan cada minuto.
	const history = live(() => liveWorkoutHistory());
	const clock = minuteClock();
	const loaded = $derived(history.value !== undefined);
	const months = $derived(groupByMonth(history.value ?? []));
</script>

<!-- Historial no es pestaña: se llega desde Hoy y se vuelve desde aquí. -->
<a href="/" class="inline-block py-2 text-sm text-muted-foreground">← Hoy</a>
<TabPage
	title="Historial"
	empty={loaded && months.length === 0 ? 'Todavía no hay entrenamientos.' : undefined}
>
	{#if !loaded}
		<p class="mt-4 text-muted-foreground">Cargando…</p>
	{:else}
		{#each months as { month, entries } (month)}
			<section class="mt-6">
				<h2 id="mes-{month}" class="text-sm text-muted-foreground">{monthLabel(month)}</h2>
				<ol class="divide-y" aria-labelledby="mes-{month}">
					{#each entries as entry (entry.workout.id)}
						{@const row = historyRow(entry)}
						<li>
							<a
								href="/historial/{row.workout.id}"
								class="flex items-center justify-between gap-3 py-3 active:bg-muted"
							>
								<span class="min-w-0">
									<span class="block">
										{relativeDayLabel(row.workout.startedAt, clock.now)} · {workoutTitle(
											row.workout
										)}
									</span>
									<span class="block text-sm text-muted-foreground">
										{workoutSummaryLabel(row.exercises, row.sets)}
									</span>
								</span>
								{#if row.duration !== null}
									<span class="shrink-0 text-sm text-muted-foreground">
										{formatElapsed(row.duration)}
									</span>
								{/if}
							</a>
						</li>
					{/each}
				</ol>
			</section>
		{/each}
	{/if}
</TabPage>
