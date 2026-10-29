<script lang="ts">
	import TabPage from '#lib/components/TabPage.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
</script>

<TabPage title="Hoy" empty="Aquí irá el entrenamiento de hoy.">
	<Button href="/ejercicios" class="mt-6">Buscar un ejercicio</Button>
</TabPage>
