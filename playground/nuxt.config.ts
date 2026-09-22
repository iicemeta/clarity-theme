export default defineNuxtConfig({
	// 通过 workspace 链接验证 Theme 包的 extends 入口，
	// 与下游通过 npm 包使用的方式保持一致。
	extends: [
		'clarity-theme',
	],

	nitro: {
		prerender: {
			// 兼容性基准页不从首页链接可达，需显式预渲染
			routes: [
				'/compatibility/markdown',
				'/compatibility/code',
				'/compatibility/mdc',
				'/compatibility/math',
				'/compatibility/mermaid',
				'/compatibility/music',
				'/compatibility/image',
				'/compatibility/routing/permalink-route',
			],
		},
	},
})
