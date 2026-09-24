import type { ClarityConfig, ClarityConfigInput } from './schema'
import { clarityConfigSchema, legacyConfigKeys, stripLegacyConfigKeys } from './schema'

/**
 * 定义 Clarity Theme 站点配置
 *
 * 在消费项目根目录的 clarity.config.ts 中使用，
 * 此处会立即完成默认值填充与校验，避免错误配置进入构建流程。
 */
export function defineClarityConfig(config: ClarityConfigInput): ClarityConfig {
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
