<script lang="ts">
	import { db } from '#lib/log/db.js';
	import { live } from '#lib/log/live.svelte.js';
	import { liveSyncStatus } from '#lib/sync/client.js';
	import { syncState } from '#lib/sync/runtime.svelte.js';

	/** Cuántos cambios esperan subir y cuándo fue la última sincronización (spec #7). */
	const status = live(() => liveSyncStatus(db));

	const lastSync = $derived.by(() => {
		const at = status.value?.lastSyncAt;
		if (!at) return 'nunca';
		return new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(
			new Date(at)
		);
	});
</script>

<dl aria-label="Sincronización" class="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
	<dt class="text-muted-foreground">Pendientes de subir</dt>
	<dd>{status.value?.pending ?? '…'}</dd>
	<dt class="text-muted-foreground">Última sincronización</dt>
	<dd>{lastSync}</dd>
</dl>
{#if syncState.error}
	<p class="mt-2 text-sm text-error-content" role="status">
		No se pudo sincronizar: {syncState.error}. Se reintenta al recuperar red.
	</p>
{/if}
