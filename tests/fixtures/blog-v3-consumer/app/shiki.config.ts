export default defineConfig({
	themes: {
		light: () => import('shiki/themes/fixture-light.mjs'),
		dark: () => import('shiki/themes/fixture-dark.mjs'),
	},
})
