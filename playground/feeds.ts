import type { FeedGroup } from 'clarity-theme/config'

export default [
	{
		name: '朋友',
		desc: '示例友链数据',
		entries: [
			{
				author: '示例博主',
				title: '示例博客',
				desc: '用于验证友链页与 OPML 生成',
				link: 'https://friend.example.com/',
				feed: 'https://friend.example.com/atom.xml',
				icon: 'https://friend.example.com/favicon.svg',
				avatar: 'https://friend.example.com/avatar.webp',
				archs: ['Nuxt'],
				date: '2026-01-02',
			},
		],
	},
] satisfies FeedGroup[]
