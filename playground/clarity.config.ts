import { defineClarityConfig } from 'clarity-theme/config'

// 兼容性测试钩子：仅在 scripts/test-compatibility.mjs 显式注入环境变量时生效，
// 用于在真实浏览器中验证 anti-mirror 从镜像主机导航回规范主机。
const compatSiteUrl = process.env.CLARITY_COMPAT_SITE_URL
const compatAntiMirrorBlacklist = process.env.CLARITY_COMPAT_ANTI_MIRROR_BLACKLIST

export default defineClarityConfig({
	site: {
		title: 'Clarity Playground',
		subtitle: 'Clarity Theme 示例站点',
		description: 'Clarity Theme 的最小可运行示例，用于验证 Layer 独立构建与站点配置注入。',
		url: compatSiteUrl ?? 'https://clarity-theme.example.com/',
		language: 'zh-CN',
		timezone: 'Asia/Shanghai',
		established: '2026-01-01',
		favicon: '/favicon.svg',
		author: {
			name: 'Clarity 用户',
			email: 'user@example.com',
			homepage: 'https://clarity-theme.example.com/',
		},
		copyright: {
			abbr: 'CC BY 4.0',
			name: '署名 4.0 国际',
			url: 'https://creativecommons.org/licenses/by/4.0/deed.zh-hans',
		},
	},

	article: {
		defaultCategory: '未分类',
		categories: {
			未分类: { icon: 'tabler:circle-dashed' },
			技术: { icon: 'tabler:code', color: '#7777ff' },
			生活: { icon: 'tabler:leaf', color: '#ff7777' },
		},
		types: {
			tech: {},
			story: {},
		},
	},

	feed: {
		limit: 20,
		enableStyle: true,
	},

	stats: {
		// 仅统计正式文章，避免 link.md 与 compatibility 基准页进入字数统计
		includePaths: ['posts/%'],
	},

	integrations: {
		scripts: [],
	},

	features: {
		atom: true,
		opml: true,
		stats: true,
		antiMirror: compatAntiMirrorBlacklist
			? { blacklist: compatAntiMirrorBlacklist.split(',').filter(Boolean) }
			: false,
	},

	changelog: [
		{ date: '2026-01-01', text: '使用 Clarity Theme 建站' },
	],
})
