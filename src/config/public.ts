import type {
	ClarityArticleConfig,
	ClarityAuthor,
	ClarityChangelogEntry,
	ClarityConfig,
	ClarityIntegrationsConfig,
	ClaritySiteConfig,
} from './schema'

/**
 * 由 clarity.config.ts 注入 appConfig 的客户端可见配置。
 *
 * 可见性约定（详见 docs/config-api-audit.md）：
 * - 只有客户端渲染确实需要的字段进入 appConfig；
 * - feed、完整 stats、features 与 site.author.email 等服务端/构建期字段
 *   改由 Nitro 私有 runtimeConfig 提供（config/server.ts），不进入客户端 bundle；
 * - 仅构建期使用的字段（integrations.scripts、article.hidePostPrefix、
 *   article.robotsNotIndex）由模块直接消费，同样不进入 appConfig。
 * 这些配置允许进入客户端 bundle，不包含任何密钥（secret 只允许 runtimeConfig）。
 */

/** appConfig 中暴露的 integrations 子集：scripts 仅构建期注入 <head> */
export type ClarityPublicIntegrationsConfig = Omit<ClarityIntegrationsConfig, 'scripts'>

/** appConfig 中暴露的 site 子集：author.email 仅用于服务端 feed/meta 输出 */
export type ClarityPublicSiteConfig = Omit<ClaritySiteConfig, 'author'> & {
	author: Omit<ClarityAuthor, 'email'>
}

/** appConfig 中暴露的 article 子集：其余字段仅构建期使用 */
export type ClarityPublicArticleConfig = Pick<ClarityArticleConfig, 'categories' | 'order'>

/**
 * appConfig 中暴露的 stats 子集：由 includePaths 派生的展示事实，
 * 决定 BlogStats 标签使用「文章字数」还是「总字数」，不透出完整匹配规则。
 */
export interface ClarityPublicStatsConfig {
	postsOnly: boolean
}

export interface ClarityPublicConfig {
	site: ClarityPublicSiteConfig
	article: ClarityPublicArticleConfig
	stats: ClarityPublicStatsConfig
	integrations: ClarityPublicIntegrationsConfig
	changelog: ClarityChangelogEntry[]
}

export function toPublicClarityConfig(config: ClarityConfig): ClarityPublicConfig {
	return {
		site: {
			...config.site,
			author: {
				name: config.site.author.name,
				avatar: config.site.author.avatar,
				homepage: config.site.author.homepage,
			},
		},
		article: {
			categories: config.article.categories,
			order: config.article.order,
		},
		stats: {
			postsOnly: config.stats.includePaths.length > 0,
		},
		integrations: config.integrations.twikoo
			? { twikoo: config.integrations.twikoo }
			: {},
		changelog: config.changelog,
	}
}
