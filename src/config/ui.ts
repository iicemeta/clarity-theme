/**
 * Clarity Theme UI 默认值（上游 blog-v3 `app/app.config.ts` 的可分发子集）。
 *
 * 上游的 app/app.config.ts 属于消费项目文件（其 init-project 会重置），
 * Layer 无法引用消费项目的 blog.config 来派生 logo / subtitle / copyright，
 * 因此这些站点派生值由 src/modules/clarity-config 注入；
 * 本文件只保留不携带个人数据的结构性默认值（footer.iconNav / footer.nav
 * 的个人链接不能随 npm 包分发，默认置空，由消费项目自行填写）。
 */
import type { Nav, NavItem } from '../types/nav'

// @keep-sorted
export default {
	component: {
		alert: {
			/** 默认使用卡片风格还是扁平风格 */
			defaultStyle: 'card' as 'card' | 'flat',
		},

		codeblock: {
			/** 代码块触发折叠的行数 */
			triggerRows: 32,
			/** 代码块折叠后的行数 */
			collapsedRows: 16,
			/** 启用代码块缩进导航会关闭空格渲染 */
			enableIndentGuide: true,
			/** 代码块缩进导航(Indent Guide)竖线匹配空格数 */
			indent: 4,
			/** tab渲染宽度 */
			tabSize: 3,
		},

		/** 文章开头摘要 */
		excerpt: {
			animation: true,
			caret: '_',
		},

		/** 精选文章 Slide */
		slide: {
			/** 适合封面图无字时启用 */
			showTitle: true,
		},

		stats: {
			/** 归档页面每年标题对应的年龄，无需展示时可设为 0 */
			birthYear: 0,
			/** blog-stats widget 的预置文本 */
			wordCount: '',
		},
	},

	// @keep-sorted
	footer: {
		/** 侧边栏底部图标导航（个人链接不随 Theme 分发，由消费项目配置） */
		iconNav: [] as NavItem[],
		/** 页脚站点地图（同上，默认为空） */
		nav: [] as Nav,
	},

	/** 左侧栏顶部 Logo */
	header: {
		/** 展示标题文本，否则展示纯 Logo */
		showTitle: true,
		/** 标题后的随机表情 */
		emojiTail: ['📝', '✨', '🌱'] as string[],
	},

	/** 友链页面 */
	link: {
		/** 无订阅源展示静音图标 */
		remindNoFeed: true,
		/** 友链分组内随机排序 */
		randomInGroup: true,
	},

	/** 左侧栏导航 */
	nav: [
		{
			title: '',
			items: [
				{ icon: 'tabler:files', text: '文章', url: '/' },
				{ icon: 'tabler:link', text: '友链', url: '/link' },
				{ icon: 'tabler:archive', text: '归档', url: '/archive' },
			],
		},
	] as Nav,

	pagination: {
		perPage: 10,
		/** 默认排序方式，需要是 article.order 中的键名 */
		sortOrder: 'date',
		/** 允许（普通/预览/归档）文章列表正序，开启后排序方式左侧图标可切换顺序 */
		allowAscending: false,
	},

	themes: {
		light: {
			icon: 'tabler:sun',
			tip: '浅色模式',
		},
		system: {
			icon: 'tabler:device-desktop',
			tip: '跟随系统',
		},
		dark: {
			icon: 'tabler:moon',
			tip: '深色模式',
		},
	},
}
