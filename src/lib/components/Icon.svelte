<script lang="ts">
	/** Dibuja un símbolo del sprite `static/icons.svg` (se regenera con `pnpm build:icons`). */
	let { name, class: className }: { name: string; class?: string } = $props();
</script>

<svg class={className} aria-hidden="true">
	<use href="/icons.svg#{name}" />
</svg>
