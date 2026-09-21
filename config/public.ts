import type {
	ClarityArticleConfig,
	ClarityChangelogEntry,
	ClarityConfig,
	ClarityFeaturesConfig,
	ClarityFeedConfig,
	ClarityIntegrationsConfig,
	ClaritySiteConfig,
	ClarityStatsConfig,
} from './schema'

/**
 * 由 clarity.config.ts 注入 appConfig 的公共站点配置。
 * 这些配置允许进入客户端 bundle，不包含任何密钥。
 */
export interface ClarityPublicConfig {
	site: ClaritySiteConfig
	article: ClarityArticleConfig
	feed: ClarityFeedConfig
	stats: ClarityStatsConfig
	integrations: ClarityIntegrationsConfig
	features: ClarityFeaturesConfig
	changelog: ClarityChangelogEntry[]
}

export function toPublicClarityConfig(config: ClarityConfig): ClarityPublicConfig {
	return {
		site: config.site,
		article: config.article,
		feed: config.feed,
		stats: config.stats,
		integrations: config.integrations,
		features: normalizeAntiMirror(config.features),
		changelog: config.changelog,
	}
}

function normalizeAntiMirror(features: ClarityFeaturesConfig): ClarityFeaturesConfig {
	if (typeof features.antiMirror !== 'boolean') {
		return features
	}
	return {
		...features,
		antiMirror: features.antiMirror
			? { blacklist: [] }
			: false,
	}
}
