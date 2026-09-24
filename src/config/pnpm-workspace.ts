/**
 * Theme 内置的技术栈版本数据（上游 BlogTech 通过 ~~/pnpm-workspace.yaml
 * 的 catalogs 展示 Vue / Nuxt / Nuxt Content 版本）。
 *
 * 分组结构与上游 blog-v3 的 pnpm-workspace.yaml 保持一致：上游 BlogTech
 * 使用 es-toolkit 的 merge(...Object.values(catalogs))（二元签名），
 * 至少需要两个分组才能正常展开。
 */
export const fallbackPnpmWorkspace = {
	catalogs: {
		content: {
			'@nuxt/content': '^3.16.0',
		},
		framework: {
			nuxt: '^4.5.2',
			vue: '^3.5.42',
		},
	},
} as const
