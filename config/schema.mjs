import { z } from 'zod'

/**
 * clarity.config 运行时 Schema（JS 实现）。
 *
 * 类型真源在同目录 schema.ts（含完整 JSDoc），
 * 本文件供 Node 原生 TS 剥离受限场景（node_modules 内）
 * 与运行时链使用；修改 schema.ts 后需同步本文件。
 *
 * Schema 一律使用 strictObject：未知字段直接报错而非静默丢弃。
 */

export const clarityHeadScriptSchema = z.record(z.string(), z.union([
	z.string(),
	z.number(),
	z.boolean(),
]))

export const clarityAuthorSchema = z.strictObject({
	name: z.string().min(1),
	avatar: z.string().optional(),
	email: z.string().optional(),
	homepage: z.string().optional(),
})

export const claritySiteSchema = z.strictObject({
	title: z.string().min(1),
	subtitle: z.string().optional(),
	description: z.string().min(1),
	/** 站点规范 URL（以 / 结尾，用于 new URL() 相对路径解析） */
	url: z.string().url().refine(
		value => value.endsWith('/'),
		'站点 URL 必须以 / 结尾（例如 https://example.com/）',
	),
	language: z.string().default('zh-CN'),
	timezone: z.string().default('Asia/Shanghai'),
	established: z.string().optional(),
	favicon: z.string().default('/favicon.svg'),
	author: clarityAuthorSchema,
	copyright: z.strictObject({
		abbr: z.string().optional(),
		name: z.string().optional(),
		url: z.string().optional(),
	}).optional(),
})

export const clarityArticleSchema = z.strictObject({
	defaultCategory: z.string().default('未分类'),
	categories: z.record(z.string(), z.strictObject({
		icon: z.string().optional(),
		color: z.string().optional(),
	})).default({}),
	types: z.record(z.string(), z.looseObject({})).default({ tech: {} }),
	order: z.record(z.string(), z.string()).default({ date: '创建日期', updated: '更新日期' }),
	hidePostPrefix: z.boolean().default(true),
	robotsNotIndex: z.array(z.string()).default([]),
})

export const clarityFeedSchema = z.strictObject({
	limit: z.number().int().positive().default(50),
	enableStyle: z.boolean().default(true),
})

export const clarityStatsSchema = z.strictObject({
	includePaths: z.array(z.string()).default([]),
})

export const clarityIntegrationsSchema = z.strictObject({
	twikoo: z.strictObject({
		envId: z.string(),
		preload: z.string().optional(),
	}).optional(),
	scripts: z.array(clarityHeadScriptSchema).default([]),
})

export const clarityAntiMirrorSchema = z.union([
	z.boolean(),
	z.strictObject({
		blacklist: z.array(z.string()).default([]),
	}),
])

export const clarityFeaturesSchema = z.strictObject({
	atom: z.boolean().default(true),
	opml: z.boolean().default(true),
	stats: z.boolean().default(true),
	antiMirror: clarityAntiMirrorSchema.default(false),
})

export const clarityChangelogEntrySchema = z.strictObject({
	date: z.string(),
	text: z.string(),
})

export const clarityConfigSchema = z.strictObject({
	site: claritySiteSchema,
	article: clarityArticleSchema.prefault({}),
	feed: clarityFeedSchema.prefault({}),
	stats: clarityStatsSchema.prefault({}),
	integrations: clarityIntegrationsSchema.prefault({}),
	features: clarityFeaturesSchema.prefault({}),
	changelog: z.array(clarityChangelogEntrySchema).default([]),
})
