export default defineNuxtConfig({
	// 通过 workspace 链接验证 Theme 包的 extends 入口，
	// 与下游通过 npm 包使用的方式保持一致。
	extends: [
		'clarity-theme',
	],
})
