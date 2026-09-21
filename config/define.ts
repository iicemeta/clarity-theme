import type { ClarityConfig, ClarityConfigInput } from './schema'
import { clarityConfigSchema } from './schema'

/**
 * 定义 Clarity Theme 站点配置
 *
 * 在消费项目根目录的 clarity.config.ts 中使用，
 * 此处会立即完成默认值填充与校验，避免错误配置进入构建流程。
 */
export function defineClarityConfig(config: ClarityConfigInput): ClarityConfig {
	return clarityConfigSchema.parse(config)
}
