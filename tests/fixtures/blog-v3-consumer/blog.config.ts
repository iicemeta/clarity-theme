export default {
	title: 'Fixture Blog',
	subtitle: 'A migration fixture',
	description: 'A minimal blog-v3 fixture used to validate migration rules.',
	url: 'https://fixture.example.com/',
	author: {
		name: 'Fixture Author',
		avatar: '/avatar.svg',
		email: 'author@fixture.example.com',
		homepage: 'https://author.example.com/',
	},
	favicon: '/favicon.svg',
	language: 'zh-CN',
	timeEstablished: '2020-01-01',
	timeZone: 'Asia/Taipei',
	defaultCategory: 'General',
	article: {
		categories: {
			General: { icon: 'tabler:circle-dashed' },
			Tech: { icon: 'tabler:code', color: '#7777ff' },
		},
		types: { tech: {}, story: {} },
		order: { date: 'Created', updated: 'Updated' },
		useRandomPremalink: true,
		hidePostPrefix: true,
		robotsNotIndex: ['/preview'],
	},
	feed: {
		limit: 20,
		enableStyle: false,
	},
	scripts: [
		{ src: 'https://analytics.fixture.example.com/script.js', defer: true },
		{ src: 'https://cdn.fixture.example.com/twikoo.js', defer: true },
	],
	stats: {
		includePaths: ['posts/%'],
	},
	twikoo: {
		envId: 'https://twikoo.fixture.example.com/',
		preload: 'https://twikoo.fixture.example.com/',
	},
}
