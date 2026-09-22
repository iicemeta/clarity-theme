import blogConfig from '../blog.config'

export default defineAppConfig({
	...blogConfig,
	component: {
		codeblock: {
			triggerRows: 24,
			collapsedRows: 12,
		},
	},
	header: {
		emojiTail: ['fixture'],
	},
	nav: [
		{
			title: '',
			items: [{ icon: 'tabler:files', text: 'Posts', url: '/' }],
		},
	],
	pagination: {
		perPage: 5,
		sortOrder: 'date',
	},
})
