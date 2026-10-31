<script lang="ts">
	import TabPage from '#lib/components/TabPage.svelte';
</script>

<!-- Historial no es pestaña: se llega desde Hoy y se vuelve desde aquí. -->
<a href="/" class="inline-block py-2 text-sm text-muted-foreground">← Hoy</a>
<TabPage title="Historial" empty="Aquí irán los entrenamientos anteriores." />
