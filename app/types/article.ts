import type { ClarityAppConfig } from '#clarity/config/app'
import type { ArticleSchema } from '#clarity/config/content'
import type { MetaSlotsTree } from '../../remark-plugins/rehype-meta-slots'

export type ArticleOrderType = keyof ClarityAppConfig['article']['order']

export interface ArticleProps extends ArticleSchema {
	path: string

	meta?: {
		coverDim?: boolean
		coverFilter?: string
		hideInfo?: boolean
		slots?: Record<string, MetaSlotsTree>
	}
}
