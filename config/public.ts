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
 *
 * 可见性约定（详见 docs/config-api-audit.md）：
 * - 仅构建期使用的字段 integrations.scripts 由模块直接消费，不进入 appConfig，避免进入客户端 bundle；
 *   article.robotsNotIndex / hidePostPrefix / useRandomPermalink 亦仅构建期使用，
 *   但 shared/utils/clarity.ts 的 useClarityArticle() 返回类型锚定了完整 article 形状，
 *   本轮无法剥离（见审计文档遗留事项）；
 * - feed / stats / site.email 目前仍保留：server 路由经 useAppConfig 读取，
 *   完全剥离需要 server/shared 侧改造（见审计文档遗留事项）。
 * 这些配置允许进入客户端 bundle，不包含任何密钥（secret 只允许 runtimeConfig）。
 */

/** appConfig 中暴露的 integrations 子集：scripts 仅构建期注入 <head> */
export type ClarityPublicIntegrationsConfig = Omit<ClarityIntegrationsConfig, 'scripts'>

export interface ClarityPublicConfig {
	site: ClaritySiteConfig
	article: ClarityArticleConfig
	feed: ClarityFeedConfig
	stats: ClarityStatsConfig
	integrations: ClarityPublicIntegrationsConfig
	features: ClarityFeaturesConfig
	changelog: ClarityChangelogEntry[]
}

export function toPublicClarityConfig(config: ClarityConfig): ClarityPublicConfig {
	return {
		site: config.site,
		article: config.article,
		feed: config.feed,
		stats: config.stats,
		integrations: config.integrations.twikoo
			? { twikoo: config.integrations.twikoo }
			: {},
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
