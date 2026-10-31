<script lang="ts">
	import { baseRoutinesOf, routineGroups } from '#lib/catalog/index.js';
	import TabPage from '#lib/components/TabPage.svelte';
</script>

<TabPage title="Rutinas">
	<section class="mt-4" aria-labelledby="rutinas-base">
		<h2 id="rutinas-base" class="text-lg">Rutinas base</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			Vienen con la app, por grupo, como punto de partida. Toca una para ver sus ejercicios y
			objetivos.
		</p>
		{#each routineGroups as group (group.id)}
			<section class="mt-6" aria-labelledby="grupo-{group.id}">
				<h3 id="grupo-{group.id}" class="text-base">{group.name}</h3>
				<p class="text-sm text-muted-foreground">{group.description}</p>
				<ul class="mt-1 divide-y">
					{#each baseRoutinesOf(group.id) as routine (routine.id)}
						<li>
							<a
								href="/rutinas/base/{routine.id}"
								class="flex items-center justify-between gap-3 py-3 active:bg-muted"
							>
								<span>{routine.name}</span>
								<span class="text-sm text-muted-foreground">
									{routine.exercises.length} ejercicios
								</span>
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</section>
</TabPage>
