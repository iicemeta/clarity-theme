import type { ClarityAppConfig, ClarityArticleConfig, ClaritySiteConfig } from '../../config/app'
import type { FeedEntry } from '../app/types/feed'

/** 获取完整 Clarity 配置（站点配置 + UI 配置） */
export function useClarityConfig(): ClarityAppConfig {
	return useAppConfig().clarity as ClarityAppConfig
}

/** 获取站点配置（标题、作者、URL 等） */
export function useClaritySite(): ClaritySiteConfig {
	return useClarityConfig().site
}

/** 获取文章配置（分类、类型、排序等） */
export function useClarityArticle(): ClarityArticleConfig {
	return useClarityConfig().article
}

/** 由站点配置生成本站订阅源条目（用于友链页与 OPML） */
export function useClaritySiteFeedEntry(): FeedEntry {
	const site = useClaritySite()
	return {
		author: site.author.name,
		title: site.title,
		desc: site.subtitle || site.description,
		link: site.url,
		feed: new URL('/atom.xml', site.url).toString(),
		icon: site.favicon,
		avatar: site.author.avatar || site.favicon,
		date: site.established || '',
		comment: '这是我自己',
	}
}
