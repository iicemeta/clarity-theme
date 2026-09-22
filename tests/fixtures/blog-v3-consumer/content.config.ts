import blogConfig from './blog.config'

export default defineContentConfig({
	collections: {
		content: defineCollection({
			source: '**',
			type: 'page',
			schema: {
				title: blogConfig.title,
			},
		}),
	},
})
