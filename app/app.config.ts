/**
 * Clarity Theme UI 默认配置。
 *
 * 站点数据（标题、作者、文章分类等）来自根目录 clarity.config.ts，
 * 由 modules/clarity-config 注入到 appConfig.clarity 中。
 *
 * 消费项目可在自己的 app/app.config.ts 中按需覆盖任意键。
 */
export default defineAppConfig({
	clarity: {
		// @keep-sorted
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
				/** 代码块缩进导航竖线匹配空格数 */
				indent: 4,
				/** tab 渲染宽度 */
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
				/** 归档页面每年标题对应的年龄，无需展示时可留空 */
				birthYear: undefined as number | undefined,
			},
		},

		// @keep-sorted
		footer: {
			/** 页脚版权信息，支持 <br> 换行等内联 HTML 标签；默认由站点配置生成 */
			copyright: '',
			/** 侧边栏底部图标导航 */
			iconNav: [] as { icon: string, text: string, url: string }[],
			/** 页脚站点地图 */
			nav: [] as {
				title: string
				items: { icon: string, text: string, url: string }[]
			}[],
		},

		/** 左侧栏顶部 Logo */
		header: {
			/** 默认使用站点作者头像 */
			logo: '',
			/** 展示标题文本，否则展示纯 Logo */
			showTitle: true,
			/** 默认使用站点副标题 */
			subtitle: '',
			emojiTail: [] as string[],
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
		],

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
	},
})
