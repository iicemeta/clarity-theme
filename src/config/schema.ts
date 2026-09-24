import { z } from 'zod'

/**
 * Schema 一律使用 strictObject：
 * 未知字段直接报错，而不是被静默丢弃（防止拼写错误悄悄失效）。
 * 唯一例外：article.types 的值使用 looseObject，作为版式扩展位。
 */

/** 注入到 <head> 的脚本（统计、评论等第三方脚本） */
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
	/** 建站日期 */
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
	/** 文章版式，首个为默认版式 */
	types: z.record(z.string(), z.looseObject({})).default({ tech: {} }),
	/** 分类排序方式，键为排序字段，值为显示名称 */
	order: z.record(z.string(), z.string()).default({ date: '创建日期', updated: '更新日期' }),
	/** 隐藏基于文件路由（非自定义链接）URL 中的 /post 路径前缀，仅模块构建期使用 */
	hidePostPrefix: z.boolean().default(true),
	/** 禁止搜索引擎收录的路径，仅模块构建期使用 */
	robotsNotIndex: z.array(z.string()).default([]),
})

export const clarityFeedSchema = z.strictObject({
	/** 订阅源最大文章数量 */
	limit: z.number().int().positive().default(50),
	/** 订阅源是否启用 XSLT 样式 */
	enableStyle: z.boolean().default(true),
})

export const clarityStatsSchema = z.strictObject({
	/**
	 * 统计范围，匹配 content 下不含扩展名的路径（stem）；空数组统计全部内容
	 * 使用 SQL LIKE 语法： % 匹配任意长度字符， _ 匹配单个字符
	 */
	includePaths: z.array(z.string()).default([]),
})

export const clarityIntegrationsSchema = z.strictObject({
	/** Twikoo 评论系统，未配置时不渲染评论区 */
	twikoo: z.strictObject({
		envId: z.string(),
		/** 预连接地址，默认使用 envId */
		preload: z.string().optional(),
	}).optional(),
	/** 向 <head> 中添加的脚本，仅模块构建期注入，不进入 appConfig */
	scripts: z.array(clarityHeadScriptSchema).default([]),
})

export const clarityAntiMirrorSchema = z.union([
	z.boolean(),
	z.strictObject({
		/** 需要跳转回源站的镜像站域名后缀 */
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
	/** 更新日志组件数据，按时间倒序展示 */
	changelog: z.array(clarityChangelogEntrySchema).default([]),
})

export type ClarityHeadScript = z.output<typeof clarityHeadScriptSchema>
export type ClarityAuthor = z.output<typeof clarityAuthorSchema>
export type ClaritySiteConfig = z.output<typeof claritySiteSchema>
export type ClarityArticleConfig = z.output<typeof clarityArticleSchema>
export type ClarityFeedConfig = z.output<typeof clarityFeedSchema>
export type ClarityStatsConfig = z.output<typeof clarityStatsSchema>
export type ClarityIntegrationsConfig = z.output<typeof clarityIntegrationsSchema>
export type ClarityAntiMirrorConfig = z.output<typeof clarityAntiMirrorSchema>
export type ClarityFeaturesConfig = z.output<typeof clarityFeaturesSchema>
export type ClarityChangelogEntry = z.output<typeof clarityChangelogEntrySchema>
export type ClarityConfig = z.output<typeof clarityConfigSchema>
export type ClarityConfigInput = z.input<typeof clarityConfigSchema>

/**
 * 0.1.x 曾接受、现已移除的配置键（点路径）。
 * strictObject 会把它们当作未知键致命报错；0.1.x consumer 兼容要求
 * 「警告 + 忽略」而非 fatal。注册表之外的未知键仍然致命（拼写保护）。
 * 兼容层计划 0.2.0 整体移除（届时本表连同剥离逻辑一起删除）。
 */
export const legacyConfigKeys: Readonly<Record<string, string>> = {
	'article.useRandomPermalink': '随机固定链接生成属消费项目构建脚手架，主题不再提供',
}

/** 检测并剥离 legacy 键：返回剥离后的浅拷贝配置与命中的 legacy 键路径 */
export function stripLegacyConfigKeys(raw: unknown): { config: unknown, legacyKeys: string[] } {
	if (!raw || typeof raw !== 'object') {
		return { config: raw, legacyKeys: [] }
	}
	const legacyKeys = Object.keys(legacyConfigKeys).filter(keyPath => hasKeyPath(raw, keyPath))
	if (!legacyKeys.length) {
		return { config: raw, legacyKeys: [] }
	}
	const config = structuredClone(raw)
	for (const keyPath of legacyKeys) {
		deleteKeyPath(config, keyPath)
	}
	return { config, legacyKeys }
}

function hasKeyPath(value: unknown, keyPath: string): boolean {
	let node = value
	for (const segment of keyPath.split('.')) {
		if (!node || typeof node !== 'object' || !(segment in (node as Record<string, unknown>))) {
			return false
		}
		node = (node as Record<string, unknown>)[segment]
	}
	return true
}

function deleteKeyPath(value: unknown, keyPath: string): void {
	const segments = keyPath.split('.')
	let node = value as Record<string, unknown> | undefined
	for (const segment of segments.slice(0, -1)) {
		node = node?.[segment] as Record<string, unknown> | undefined
		if (!node || typeof node !== 'object') {
			return
		}
	}
	delete node?.[segments[segments.length - 1] as string]
}
