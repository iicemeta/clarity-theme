import type { ReadTimeResults } from 'reading-time'
import type { ClarityConfig } from './schema'
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { defineSitemapSchema } from '@nuxtjs/sitemap/content'
import { z } from 'zod'
import { clarityConfigSchema } from './schema'

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

	/**
	 * 开放索引签名：clarity.config.ts 的 article.order 允许自定义排序键，
	 * 上游归档页通过 article[sortOrder] 索引（上游依赖其配置字面量类型）。
	 */
	[key: string]: unknown
}

function createArticleSchema(config: ClarityConfig) {
	// 兜底：types 为空时 z.enum([]) 非法，统一回退到默认版式
	const articleTypes = Object.keys(config.article.types)
	const typeValues = articleTypes.length > 0 ? articleTypes : ['tech']

	return z.object({
		title: z.string().optional(),
		description: z.string().optional(),
		date: z.string().optional(),
		updated: z.string().optional(),
		published: z.string().optional(),
		categories: z.array(z.string()).default([config.article.defaultCategory]),
		tags: z.array(z.string()).default([]),
		type: z.enum(typeValues as any).optional().default(typeValues[0]),

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
	const parsed = clarityConfigSchema.parse(config)
	return defineContentConfig({
		collections: {
			content: defineCollection({
				source: '**',
				type: 'page',
				schema: createArticleSchema(parsed).extend({
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
