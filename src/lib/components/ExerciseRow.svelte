<script lang="ts">
	import { equipmentLabel, type Exercise } from '#lib/catalog/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';

	/** Una fila de lista que lleva al detalle del ejercicio, con una línea opcional debajo del nombre. */
	let { exercise, note }: { exercise: Exercise; note?: string } = $props();
</script>

<li>
	<a
		href="/ejercicios/{exercise.id}"
		class="flex items-center justify-between gap-3 py-3 active:bg-muted"
	>
		<span>
			<span class="block">{exercise.name}</span>
			{#if note}
				<span class="block text-sm text-muted-foreground">{note}</span>
			{/if}
		</span>
		<Badge variant="outline">{equipmentLabel[exercise.equipment]}</Badge>
	</a>
</li>
