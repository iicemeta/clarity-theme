import type {
	ClarityConfig,
	ClarityFeaturesConfig,
	ClarityFeedConfig,
	ClaritySiteConfig,
	ClarityStatsConfig,
} from './schema'

/**
 * 注入 Nitro 私有 runtimeConfig（非 public）的服务端配置形状。
 *
 * 这些字段只允许在 server/ 侧通过 useClarityServerConfig() 读取：
 * - site 完整形状（含 author.email，用于 Atom/OPML 等公开元数据输出）；
 * - feed / stats 完整配置；
 * - features 中需要运行时路由守卫的开关（antiMirror 仅构建期注入脚本，不需要运行时值）。
 */
export interface ClarityServerConfig {
	site: ClaritySiteConfig
	feed: ClarityFeedConfig
	stats: ClarityStatsConfig
	features: Pick<ClarityFeaturesConfig, 'atom' | 'opml' | 'stats'>
}

export function toServerClarityConfig(config: ClarityConfig): ClarityServerConfig {
	return {
		site: config.site,
		feed: config.feed,
		stats: config.stats,
		features: {
			atom: config.features.atom,
			opml: config.features.opml,
			stats: config.features.stats,
		},
	}
}
