<script lang="ts">
	import { equipmentLabel, type Exercise } from '#lib/catalog/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';

	/** Una fila de lista que lleva al detalle del ejercicio. */
	let { exercise }: { exercise: Exercise } = $props();
</script>

<li>
	<a
		href="/ejercicios/{exercise.id}"
		class="flex items-center justify-between gap-3 py-3 active:bg-muted"
	>
		<span>{exercise.name}</span>
		<Badge variant="outline">{equipmentLabel[exercise.equipment]}</Badge>
	</a>
</li>
