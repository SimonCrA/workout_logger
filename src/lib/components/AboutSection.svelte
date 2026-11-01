<script lang="ts">
	/** "Acerca de" de la app anterior: igual con y sin cuenta, por eso vive fuera del panel de la cuenta. */
	const SUPPORT_EMAIL = 'simonct3ch@gmail.com';
</script>

<section aria-label="Acerca de" class="mt-10 border-t pt-6">
	<h2 class="text-lg">Acerca de</h2>
	<dl class="mt-3 space-y-2 text-sm">
		<div class="flex gap-2">
			<dt class="text-muted-foreground">Versión</dt>
			<dd>{__APP_VERSION__}</dd>
		</div>
		<div class="flex gap-2">
			<dt class="text-muted-foreground">Soporte</dt>
			<dd><a href="mailto:{SUPPORT_EMAIL}" class="text-primary underline">{SUPPORT_EMAIL}</a></dd>
		</div>
	</dl>
</section>
