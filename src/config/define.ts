import type { ClarityConfig, ClarityConfigInput } from './schema'
import { clarityConfigSchema } from './schema'

/**
 * 定义 Clarity Theme 站点配置
 *
 * 在消费项目根目录的 clarity.config.ts 中使用，
 * 此处会立即完成默认值填充与校验，避免错误配置进入构建流程。
 */
export function defineClarityConfig(config: ClarityConfigInput): ClarityConfig {
	const result = clarityConfigSchema.safeParse(config)
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
