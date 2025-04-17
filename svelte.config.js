import { vitePreprocess } from '@astrojs/svelte';

export default {
	compilerOptions: {
		runes: true
	},
	preprocess: vitePreprocess(),
}
