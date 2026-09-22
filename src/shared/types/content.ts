import type { PageCollectionItemBase } from '@nuxt/content'

/**
 * Theme 内部使用的 content 集合行类型。
 *
 * 消费项目的精确集合类型由 @nuxt/content 按站点 schema 生成，并通过
 * module augmentation 注入消费项目上下文。Theme 作为 node_modules Layer
 * 解析到的 @nuxt/content 类型实例无法稳定共享该 augmentation（pnpm 严格
 * 布局下会形成双实例），因此 Theme 内部只依赖自身 schema 的稳定字段。
 */
export type ClarityContentRow = PageCollectionItemBase & {
	title?: string
	description?: string
	date?: string
	updated?: string
	published?: string
	categories?: string[]
	tags?: string[]
	type?: string
	image?: string
	recommend?: number
	draft?: boolean
	permalink?: string
	readingTime: {
		text: string
		minutes: number
		time: number
		words: number
	}
}
