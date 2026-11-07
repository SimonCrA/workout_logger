<script lang="ts">
	/** "Acerca de": la versión y el soporte, igual con y sin sesión; cierra Perfil. */
	const SUPPORT_EMAIL = 'simonct3ch@gmail.com';
</script>

<section aria-label="Acerca de" class="mt-6 space-y-1.5">
	<h2 class="ml-4 text-xs tracking-wider text-muted-foreground uppercase">Acerca de</h2>
	<dl class="divide-y overflow-hidden rounded-2xl border bg-white text-sm">
		<div class="flex min-h-12 items-center justify-between gap-3 px-4">
			<dt class="text-primary">Versión</dt>
			<dd class="text-muted-foreground">{__APP_VERSION__}</dd>
		</div>
		<div class="flex min-h-12 items-center justify-between gap-3 px-4">
			<dt class="text-primary">Soporte</dt>
			<dd>
				<a href="mailto:{SUPPORT_EMAIL}" class="text-muted-foreground underline">{SUPPORT_EMAIL}</a>
			</dd>
		</div>
	</dl>
</section>
