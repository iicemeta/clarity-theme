import { defineCollection, defineContentConfig } from '@nuxt/content'
import { defineSitemapSchema } from '@nuxtjs/sitemap/content'
import { z } from 'zod'
import { clarityConfigSchema } from './schema.mjs'

/**
 * createClarityContentConfig 运行时实现（JS）。
 *
 * 类型真源在同目录 content.ts；
 * @nuxt/content 的配置加载使用 Node 原生 TS 剥离，
 * 不允许 node_modules 内的 TS 文件，因此运行时链必须是 .mjs。
 */

function createArticleSchema(config) {
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
		type: z.enum(typeValues).optional().default(typeValues[0]),

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
	})
}

export function createClarityContentConfig(config) {
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
							const lastmod = (entry.updated || entry.published || entry.date)
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
