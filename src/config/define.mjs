import { clarityConfigSchema, legacyConfigKeys, stripLegacyConfigKeys } from './schema.mjs'

/**
 * defineClarityConfig 运行时实现（JS）。
 * 类型真源在同目录 define.ts；用于 Node 原生 TS 剥离受限场景
 * （node_modules 内不允许 TS 文件）与纯 ESM 运行时链。
 */
export function defineClarityConfig(config) {
	const { config: stripped, legacyKeys } = stripLegacyConfigKeys(config)
	for (const key of legacyKeys) {
		console.warn(
			`[clarity-config] clarity.config.ts 的 ${key} 已废弃（${legacyConfigKeys[key]}），已忽略。`
			+ '该 0.1.x 兼容将在 0.2.0 移除，请从配置中删除此键。',
		)
	}
	const result = clarityConfigSchema.safeParse(stripped)
	if (!result.success) {
		const issues = result.error.issues
			.map(issue => `  - ${issue.path.join('.') || '(根对象)'}: ${issue.message}`)
			.join('\n')
		throw new Error(
			`clarity.config.ts 校验失败：\n${issues}\n`
			+ '未知字段会被拒绝：请检查拼写，或参考 docs/guides/configuration.md 的字段契约。',
			{ cause: result.error },
		)
	}
	return result.data
}
