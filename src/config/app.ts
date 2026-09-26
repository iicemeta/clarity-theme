import type { NavItem } from '../types/nav'
import type { ClarityPublicIntegrationsConfig } from './public'
import type { ClarityArticleConfig, ClarityAuthor, ClarityFeedConfig, ClarityHeadScript, ClarityStatsConfig } from './schema'

export interface NavGroup {
	title: string
	items: NavItem[]
}

/** Theme 提供的 UI 默认值，全部可由消费项目在 app/app.config.ts 中覆盖 */
export interface ClarityUiConfig {
	component: {
		alert: {
			defaultStyle: 'card' | 'flat'
		}
		codeblock: {
			triggerRows: number
			collapsedRows: number
			enableIndentGuide: boolean
			indent: number
			tabSize: number
		}
		excerpt: {
			animation: boolean
			caret: string
		}
		slide: {
			showTitle: boolean
		}
		stats: {
			/** 归档页面每年标题对应的年龄，0 表示不展示 */
			birthYear: number
			/** blog-stats widget 的预置文本 */
			wordCount: string
		}
	}
	footer: {
		/** 页脚版权信息，支持 <br> 等内联 HTML */
		copyright: string
		/** 侧边栏底部图标导航 */
		iconNav: NavItem[]
		/** 页脚站点地图 */
		nav: NavGroup[]
	}
	header: {
		/** 左侧栏顶部 Logo，默认使用 site.author.avatar */
		logo: string
		/** 展示标题文本，否则仅展示 Logo */
		showTitle: boolean
		/** 标题下的副标题，默认使用 site.subtitle */
		subtitle: string
		/** 标题后的随机表情 */
		emojiTail: string[]
	}
	link: {
		/** 无订阅源展示静音图标 */
		remindNoFeed: boolean
		/** 友链分组内随机排序 */
		randomInGroup: boolean
	}
	/** 左侧栏导航 */
	nav: NavGroup[]
	pagination: {
		perPage: number
		/** 默认排序方式，需为 article.order 中的键名 */
		sortOrder: string
		/** 允许文章列表正序，开启后排序方式左侧图标可切换顺序 */
		allowAscending: boolean
	}
	themes: Record<'light' | 'system' | 'dark', {
		icon: string
		tip: string
	}>
}

/**
 * CustomAppConfig 中 article 的声明形状。
 *
 * 必须是 interface（而非 type 别名）：MergedAppConfig 对 extends Record 的
 * 类型会进入递归合并，Record<string, string> 的索引签名会把 order 键类型
 * 碾碎成 keyof any；interface 不带隐式索引签名，直接整体采用本类型。
 */
export interface ClarityAppConfigArticle extends ClarityArticleConfig {
	categories: Record<string, { icon?: string, color?: string }>
}

/**
 * 上游 blog-v3 的扁平 AppConfig 形状（blog.config.ts 展开进 app.config.ts）。
 * Clarity 由 clarity-config 模块注入同一形状，上游同步组件保持 byte-identical。
 */
export interface ClarityFlatAppConfig extends ClarityUiConfig {
	title: string
	subtitle: string
	description: string
	author: ClarityAuthor
	copyright: { abbr: string, name: string, url: string }
	favicon: string
	language: string
	timeEstablished: string
	timeZone: string
	url: string
	defaultCategory: string
	article: ClarityArticleConfig
	feed: ClarityFeedConfig
	scripts: ClarityHeadScript[]
	stats: ClarityStatsConfig
	twikoo?: ClarityPublicIntegrationsConfig['twikoo']
}

/** 消费项目 app/app.config.ts 顶层扁平键的覆盖输入类型（深层可选，数组整体替换） */
export type ClarityFlatAppConfigInput<T = ClarityFlatAppConfig> = {
	[K in keyof T]?: T[K] extends readonly unknown[]
		? T[K]
		: T[K] extends object
			? ClarityFlatAppConfigInput<T[K]>
			: T[K]
}
