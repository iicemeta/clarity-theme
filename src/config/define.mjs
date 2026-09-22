import { clarityConfigSchema } from './schema.mjs'

/**
 * defineClarityConfig 运行时实现（JS）。
 * 类型真源在同目录 define.ts；用于 Node 原生 TS 剥离受限场景
 * （node_modules 内不允许 TS 文件）与纯 ESM 运行时链。
 */
export function defineClarityConfig(config) {
	const result = clarityConfigSchema.safeParse(config)
	if (!result.success) {
		const issues = result.error.issues
			.map(issue => `  - ${issue.path.join('.') || '(根对象)'}: ${issue.message}`)
			.join('\n')
		throw new Error(
			`clarity.config.ts 校验失败：\n${issues}\n`
			+ '未知字段会被拒绝：请检查拼写，或参考 docs/config-api-audit.md 的字段归属表。',
			{ cause: result.error },
		)
	}
	return result.data
}
