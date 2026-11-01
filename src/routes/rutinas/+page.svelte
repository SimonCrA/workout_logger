<script lang="ts">
	import { exerciseCountLabel } from '#lib/catalog/index.js';
	import TabPage from '#lib/components/TabPage.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { live } from '#lib/log/live.svelte.js';
	import { liveRoutines } from '#lib/log/routines.js';

	// Mis rutinas, vivas desde IndexedDB. Las rutinas base viven bajo "Crear rutina": solo se copian.
	const routines = live(() => liveRoutines());
</script>

<TabPage title="Rutinas">
	<section class="mt-4" aria-labelledby="mis-rutinas">
		<h2 id="mis-rutinas" class="text-lg">Mis rutinas</h2>
		{#if routines.value === undefined}
			<p class="mt-2 text-muted-foreground">Cargando…</p>
		{:else if routines.value.length === 0}
			<p class="mt-2 text-muted-foreground">
				Todavía no tienes rutinas. Crea una desde una rutina base o desde cero.
			</p>
		{:else}
			<ul class="mt-2 divide-y" aria-label="Mis rutinas">
				{#each routines.value as routine (routine.id)}
					<li>
						<a
							href="/rutinas/{routine.id}"
							class="flex items-center justify-between gap-3 py-3 active:bg-muted"
						>
							<span>{routine.name}</span>
							<span class="text-sm text-muted-foreground">
								{exerciseCountLabel(routine.exercises.length)}
							</span>
						</a>
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
