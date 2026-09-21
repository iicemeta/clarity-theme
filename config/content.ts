import type { ReadTimeResults } from 'reading-time'
import type { ClarityConfig } from './schema'
import { defineCollection } from '@nuxt/content'
import { defineSitemapSchema } from '@nuxtjs/sitemap/content'
import { z } from 'zod'

export interface ArticleSchema {
	title?: string
	description?: string
	date?: string
	updated?: string
	published?: string
	categories?: string[]
	tags?: string[]
	type?: keyof ClarityConfig['article']['types']

	image?: string
	recommend?: number
	references?: { title?: string, link?: string }[]
	draft?: boolean
	permalink?: string

	readingTime?: ReadTimeResults
}

function createArticleSchema(config: ClarityConfig) {
	const articleTypes = Object.keys(config.article.types)

	return z.object({
		title: z.string().optional(),
		description: z.string().optional(),
		date: z.string().optional(),
		updated: z.string().optional(),
		published: z.string().optional(),
		categories: z.array(z.string()).default([config.article.defaultCategory]),
		tags: z.array(z.string()).default([]),
		type: z.enum(articleTypes as any).optional().default(articleTypes[0]),

		image: z.string().optional(),
		recommend: z.number().optional(),
		references: z.array(z.object({
			title: z.string().optional(),
			link: z.string().optional(),
		})).optional(),
		draft: z.boolean().default(false),
		permalink: z.string().optional(),

		readingTime: z.object({
			text: z.string(),
			minutes: z.number(),
			time: z.number(),
			words: z.number(),
		}),
	}) satisfies z.ZodType<ArticleSchema>
}

/**
 * 在消费项目 content.config.ts 中生成 Clarity Content 集合：
 *
 * ```ts
 * import clarityConfig from './clarity.config'
 * import { createClarityContentConfig } from 'clarity-theme/content'
 * export default createClarityContentConfig(clarityConfig)
 * ```
 */
export function createClarityContentConfig(config: ClarityConfig) {
	return defineContentConfig({
		collections: {
			content: defineCollection({
				source: '**',
				type: 'page',
				schema: createArticleSchema(config).extend({
					sitemap: defineSitemapSchema({
						name: 'content',
						onUrl: (url, entry) => {
							const lastmod = (entry.updated || entry.published || entry.date) as string | undefined
							if (lastmod) {
								url.lastmod = new Date(lastmod).toLocaleDateString('sv')
							}
						},
						z,
					}),
				}),
			}),
		},
	})
}
