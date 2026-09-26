/**
 * Runtime/Visual Parity Fixture — 单一数据源
 *
 * 双 consumer（upstream blog-v3 与 clarity-theme）必须读取完全相同的
 * 站点数据与 UI 配置；本文件是唯一事实来源，prepare 阶段据此渲染两边的
 * 配置文件（upstream: blog.config.ts + app/app.config.ts；
 * clarity: clarity.config.ts + app/app.config.ts）。
 *
 * 确定性约束：
 *  - 全部内容/订阅/身份数据固定，无随机、无时间依赖（copyright 使用固定年份字面量）；
 *  - 友链分组内随机排序由页面查询参数 ?shuffle=false 关闭（两侧同一上游组件的内建开关）；
 *  - 头像/图标使用 data URI，避免网络抖动影响渲染与截图。
 */

export const site = {
	title: 'Parity Station',
	subtitle: 'Fixed fixture for runtime parity',
	description: 'Deterministic fixture site shared by the upstream and clarity parity consumers.',
	url: 'https://parity.example.com/',
	language: 'zh-CN',
	timezone: 'Asia/Shanghai',
	established: '2024-01-01',
	favicon: '/favicon.svg',
	copyright: { abbr: 'CC0', name: 'Parity Fixture', url: 'https://parity.example.com/about' },
	author: {
		name: 'Parity Author',
		email: 'author@parity.example.com',
		homepage: 'https://parity.example.com/',
	},
	defaultCategory: '默认',
	categories: {
		默认: { icon: 'tabler:circle-dashed' },
		技术: { icon: 'tabler:code', color: '#7777ff' },
		生活: { icon: 'tabler:leaf', color: '#ff7777' },
	},
	articleTypes: { tech: {}, story: {} },
	articleOrder: { date: '创建日期', updated: '更新日期' },
	/** component.stats（两侧同形） */
	birthYear: 2000,
	wordCount: '约1万',
	/**
	 * header
	 *  注意：emojiTail / nav 在 clarity 侧走「上游默认值」路径（Nuxt appConfig
	 *  数组合并为 concat，consumer 显式数组会与注入默认值拼接），因此其取值
	 *  必须与 src/config/ui.ts 的上游默认值一致，upstream 侧显式写同值。
	 */
	emojiTail: ['📝', '✨', '🌱'],
	/** 头像/logo：1x1 圆形 SVG data URI（确定性、无网络） */
	logo: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 32 32\'%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'16\' fill=\'%234466aa\'/%3E%3C/svg%3E',
	/** footer.iconNav（去个人化最小集） */
	iconNav: [
		{ icon: 'tabler:home', text: '个人主页', url: 'https://parity.example.com/' },
		{ icon: 'tabler:rss', text: 'Atom订阅', url: '/atom.xml' },
	],
	/** footer.nav（最小站点地图） */
	footerNav: [
		{
			title: '探索',
			items: [
				{ icon: 'tabler:rss', text: 'Atom订阅', url: '/atom.xml' },
			],
		},
	],
	/** 友链数据：两组各一条（?shuffle=false 下顺序确定） */
	feedGroups: [
		{
			name: '固定组甲',
			desc: 'Deterministic friend group A.',
			entries: [{
				author: 'Fixture Friend One',
				sitenick: 'Friend One',
				title: 'Friend One Site',
				desc: 'First deterministic friend entry.',
				link: 'https://friend-one.example.com/',
				feed: 'https://friend-one.example.com/atom.xml',
				icon: 'https://friend-one.example.com/icon.svg',
				avatar: 'https://friend-one.example.com/avatar.svg',
				archs: ['Nuxt'],
				date: '2024-02-01',
				comment: 'fixture',
			}],
		},
		{
			name: '固定组乙',
			desc: 'Deterministic friend group B.',
			entries: [{
				author: 'Fixture Friend Two',
				sitenick: 'Friend Two',
				title: 'Friend Two Site',
				desc: 'Second deterministic friend entry.',
				link: 'https://friend-two.example.com/',
				feed: 'https://friend-two.example.com/atom.xml',
				icon: 'https://friend-two.example.com/icon.svg',
				avatar: 'https://friend-two.example.com/avatar.svg',
				archs: ['Vite'],
				date: '2024-03-01',
				comment: 'fixture',
			}],
		},
	],
}

/** 侧栏导航（两侧同形；不含 /theme，fixture 不提供该页面） */
export const nav = [
	{
		title: '',
		items: [
			{ icon: 'tabler:files', text: '文章', url: '/' },
			{ icon: 'tabler:link', text: '友链', url: '/link' },
			{ icon: 'tabler:archive', text: '归档', url: '/archive' },
		],
	},
]

/** critical computed-style / geometry selectors（两侧共享组件的真实类名） */
export const criticalSelectors = [
	'#blog-root',
	'#blog-sidebar',
	'#blog-aside',
	'#content',
	'#main-content',
	'aside#blog-sidebar header',
	'#main-content footer',
	'.feed-group',
	'.feed-title',
	'.feed-list',
	'.feed-card',
	'.sitenick',
	'.archive-title',
	'.archive-year',
	'.archive-group',
	'article',
	'.text-creative',
]
