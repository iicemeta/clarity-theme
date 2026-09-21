import type { NavItem } from '../app/types/nav'
import type { ClarityPublicConfig } from './public'

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
			/** 归档页面每年标题对应的年龄 */
			birthYear?: number
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

export type ClarityAppConfig = ClarityPublicConfig & ClarityUiConfig
