<script lang="ts">
	import { page } from '$app/state';
	import { isActiveTab, tabs } from '#lib/navigation/tabs.js';
	import Icon from './Icon.svelte';
</script>

<nav
	aria-label="Pestañas"
	class="fixed inset-x-0 bottom-0 z-10 border-t bg-background pb-[env(safe-area-inset-bottom)]"
>
	<ul class="mx-auto flex max-w-lg">
		{#each tabs as tab (tab.href)}
			{@const active = isActiveTab(page.url.pathname, tab.href)}
			<li class="flex-1">
				<a
					href={tab.href}
					aria-current={active ? 'page' : undefined}
					class="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs transition-colors {active
						? 'text-primary'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					<Icon name={tab.icon} class="size-6" />
					<span>{tab.label}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>
