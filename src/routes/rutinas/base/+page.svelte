<script lang="ts">
	import { baseRoutinesOf, exerciseName, routineGroups } from '#lib/catalog/index.js';

	const exerciseNames = (entries: readonly { exerciseId: string }[]) =>
		entries.map((entry) => exerciseName(entry.exerciseId)).join(', ');
</script>

<svelte:head>
	<title>Desde una rutina base · Workout Logger</title>
</svelte:head>

<a href="/rutinas" class="inline-block py-2 text-sm text-muted-foreground">← Rutinas</a>
<h1 class="mt-2 text-2xl">Desde una rutina base</h1>
<p class="mt-1 text-sm text-muted-foreground">
	Vienen con la app, por grupo, como punto de partida. Toca una para ver sus objetivos y crear tu
	copia.
</p>

{#each routineGroups as group (group.id)}
	<section class="mt-6" aria-labelledby="grupo-{group.id}">
		<h2 id="grupo-{group.id}" class="text-sm text-muted-foreground">{group.name}</h2>
		<ul class="divide-y">
			{#each baseRoutinesOf(group.id) as routine (routine.id)}
				<li>
					<a href="/rutinas/base/{routine.id}" class="block py-3 active:bg-muted">
						<span class="block">{routine.name}</span>
						<span class="line-clamp-2 block text-sm text-muted-foreground">
							{exerciseNames(routine.exercises)}
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/each}
