import { z } from 'zod'

/** 注入到 <head> 的脚本（统计、评论等第三方脚本） */
export const clarityHeadScriptSchema = z.record(z.string(), z.union([
	z.string(),
	z.number(),
	z.boolean(),
]))

export const clarityAuthorSchema = z.object({
	name: z.string().min(1),
	avatar: z.string().optional(),
	email: z.string().optional(),
	homepage: z.string().optional(),
})

export const claritySiteSchema = z.object({
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
	copyright: z.object({
		abbr: z.string().optional(),
		name: z.string().optional(),
		url: z.string().optional(),
	}).optional(),
})

export const clarityArticleSchema = z.object({
	defaultCategory: z.string().default('未分类'),
	categories: z.record(z.string(), z.object({
		icon: z.string().optional(),
		color: z.string().optional(),
	})).default({}),
	/** 文章版式，首个为默认版式 */
	types: z.record(z.string(), z.object({}).loose()).default({ tech: {} }),
	/** 分类排序方式，键为排序字段，值为显示名称 */
	order: z.record(z.string(), z.string()).default({ date: '创建日期', updated: '更新日期' }),
	/** 新建文章时自动生成自定义链接（permalink/abbrlink） */
	useRandomPermalink: z.boolean().default(false),
	/** 隐藏基于文件路由（非自定义链接）URL 中的 /post 路径前缀 */
	hidePostPrefix: z.boolean().default(true),
	/** 禁止搜索引擎收录的路径 */
	robotsNotIndex: z.array(z.string()).default([]),
})

export const clarityFeedSchema = z.object({
	/** 订阅源最大文章数量 */
	limit: z.number().int().positive().default(50),
	/** 订阅源是否启用 XSLT 样式 */
	enableStyle: z.boolean().default(true),
})

export const clarityStatsSchema = z.object({
	/**
	 * 统计范围，匹配 content 下不含扩展名的路径（stem）；空数组统计全部内容
	 * 使用 SQL LIKE 语法： % 匹配任意长度字符， _ 匹配单个字符
	 */
	includePaths: z.array(z.string()).default([]),
})

export const clarityIntegrationsSchema = z.object({
	/** Twikoo 评论系统，未配置时不渲染评论区 */
	twikoo: z.object({
		envId: z.string(),
		/** 预连接地址，默认使用 envId */
		preload: z.string().optional(),
	}).optional(),
	/** 向 <head> 中添加的脚本 */
	scripts: z.array(clarityHeadScriptSchema).default([]),
})

export const clarityAntiMirrorSchema = z.union([
	z.boolean(),
	z.object({
		/** 需要跳转回源站的镜像站域名后缀 */
		blacklist: z.array(z.string()).default([]),
	}),
])

export const clarityFeaturesSchema = z.object({
	atom: z.boolean().default(true),
	opml: z.boolean().default(true),
	stats: z.boolean().default(true),
	antiMirror: clarityAntiMirrorSchema.default(false),
})

export const clarityChangelogEntrySchema = z.object({
	date: z.string(),
	text: z.string(),
})

export const clarityConfigSchema = z.object({
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
